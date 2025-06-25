package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.BookingConfirmationDTO;
import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.dto.PriceBreakdownDTO;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.mapper.BookingMapper;
import com.carrental.car_rental.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.scheduling.annotation.Async;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.chrono.ChronoLocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final InsuranceRepository insuranceRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final RegionRepository regionRepository;
    private final StatusRepository statusRepository;
    private final BookingMapper bookingMapper;
    private final BookingFinancialsService financialsService;
    private final PromotionRepository promotionRepository;
    private final PaymentRepository paymentRepository;

    private static final int AVAILABLE_STATUS_ID = 11;
    private static final int PENDING_STATUS_ID = 1;
    private static final int CANCELLED_STATUS_ID = 5;
    private static final int COMPLETED_STATUS_ID = 4;

    public BookingService(
            BookingRepository bookingRepository,
            CarRepository carRepository,
            InsuranceRepository insuranceRepository,
            MaintenanceRepository maintenanceRepository,
            UserRepository userRepository,
            DriverRepository driverRepository,
            RegionRepository regionRepository,
            StatusRepository statusRepository,
            BookingMapper bookingMapper,
            BookingFinancialsService financialsService,
            PromotionRepository promotionRepository,
            PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.carRepository = carRepository;
        this.insuranceRepository = insuranceRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.regionRepository = regionRepository;
        this.statusRepository = statusRepository;
        this.bookingMapper = bookingMapper;
        this.financialsService = financialsService;
        this.promotionRepository = promotionRepository;
        this.paymentRepository = paymentRepository;
    }

    public BookingDTO findById(Integer id) {
        logger.info("Fetching booking with id: {}", id);
        Booking booking = bookingRepository.findById(id)
                .filter(b -> !b.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or has been deleted."));
        return bookingMapper.toDTO(booking);
    }

    @Transactional(readOnly = true)
    public BookingDTO findByTransactionId(String transactionId) {
        logger.info("Fetching booking by transactionId: {}", transactionId);
        Payment payment = paymentRepository.findByTransactionIdAndIsDeletedFalse(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment with transactionId " + transactionId + " not found."));
        
        Booking booking = payment.getBooking();
        if (booking == null || booking.getIsDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking associated with payment " + transactionId + " not found or has been deleted.");
        }
        
        return bookingMapper.toDTO(booking);
    }

    public List<BookingDTO> findAll() {
        logger.info("Fetching all bookings");
        return bookingRepository.findAllByIsDeletedFalse()
                .stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingDTO> findByUserId(Integer userId) {
        logger.info("Fetching bookings for userId: {}", userId);
        // Sử dụng query với eager loading
        return bookingRepository.findByCustomerIdWithDetails(userId)
                .stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> findByCarId(Integer carId) {
        logger.info("Fetching bookings for carId: {}", carId);
        return bookingRepository.findByCarIdAndIsDeleted(carId, false)
                .stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDTO save(BookingDTO dto) {
        logger.info("Saving new booking with DTO: carId={}, pickupLocation={}, dropoffLocation={}, pickupDateTime={}, dropoffDateTime={}",
            dto.getCarId(), dto.getPickupLocation(), dto.getDropoffLocation(), dto.getPickupDateTime(), dto.getDropoffDateTime());

        // Validate required fields
        if (dto.getCarId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Car ID is required");
        }
        if (dto.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        if (dto.getPickupDateTime() == null || dto.getDropoffDateTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup and dropoff dates are required");
        }
        if (dto.getPickupDateTime().isAfter(dto.getDropoffDateTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup date cannot be after dropoff date");
        }

        // Validate car exists and is available
        Car car = carRepository.findById(dto.getCarId())
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found or has been deleted"));

        // Validate user exists
        User user = userRepository.findById(dto.getUserId())
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found or has been deleted"));

        // Check if car is available for the specified dates
        List<Booking> conflictingBookings = bookingRepository.findByCarIdAndOverlappingDates(
            dto.getCarId(), dto.getPickupDateTime().toLocalDate(), dto.getDropoffDateTime().toLocalDate());
        
        if (!conflictingBookings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "Car is not available for the specified dates. Please choose different dates.");
        }

        // Create booking entity
        Booking booking = new Booking();
        booking.setCar(car);
        booking.setCustomer(user);
        booking.setPickupLocation(dto.getPickupLocation());
        booking.setDropoffLocation(dto.getDropoffLocation());
        booking.setStartDate(dto.getPickupDateTime().toLocalDate());
        booking.setEndDate(dto.getDropoffDateTime().toLocalDate());
        booking.setBookingDate(Instant.now());
        booking.setStatus(statusRepository.findById(PENDING_STATUS_ID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Default status not found")));
        booking.setRegion(car.getRegion());
        booking.setWithDriver(dto.getWithDriver() != null ? dto.getWithDriver() : false);
        
        // Tính toán deposit amount nếu không có trong DTO
        BigDecimal depositAmount = dto.getDepositAmount();
        if (depositAmount == null) {
            // Tính toán deposit amount dựa trên daily rate và số ngày thuê
            long days = java.time.temporal.ChronoUnit.DAYS.between(
                dto.getPickupDateTime().toLocalDate(), 
                dto.getDropoffDateTime().toLocalDate()
            );
            if (days == 0) days = 1; // Tối thiểu 1 ngày
            
            BigDecimal dailyRate = car.getDailyRate();
            BigDecimal totalAmount = dailyRate.multiply(BigDecimal.valueOf(days));
            depositAmount = totalAmount.multiply(BigDecimal.valueOf(0.3)); // 30% deposit
            
            logger.info("Calculated deposit amount: {} for {} days at daily rate: {}", 
                depositAmount, days, dailyRate);
        }
        booking.setDepositAmount(depositAmount);
        
        // Set seat number from car
        booking.setSeatNumber(car.getNumOfSeats());
        booking.setIsDeleted(false);
        booking.setCreatedAt(Instant.now());
        booking.setUpdatedAt(Instant.now());
        booking.setIsDeleted(false);
        booking.setDepositAmount(dto.getDepositAmount() != null ? dto.getDepositAmount() : BigDecimal.ZERO);
        booking.setSeatNumber(dto.getSeatNumber() != null ? dto.getSeatNumber() : (short) 0);

        // SỬA 1: Hỗ trợ xe tự lái và có tài xế
        if (dto.getDriverId() != null && dto.getDriverId() > 0) {
            // Có tài xế được chỉ định
            Driver driver = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found with ID: " + dto.getDriverId()));
            booking.setDriver(driver);
            logger.info("Booking assigned to driver: {}", dto.getDriverId());
        } else {
            // Xe tự lái - không có tài xế
            booking.setDriver(null);
            logger.info("Booking set as self-drive (no driver)");
        }

        // SỬA 2: Sử dụng region từ input thay vì hardcode
        if (dto.getRegionId() != null && dto.getRegionId() > 0) {
            Region region = regionRepository.findById(dto.getRegionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Region not found with ID: " + dto.getRegionId()));
            booking.setRegion(region);
            logger.info("Booking assigned to region: {}", dto.getRegionId());
        } else {
            // Fallback to default region nếu không có region được chỉ định
            booking.setRegion(regionRepository.findById(1)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Default region not found")));
            logger.warn("No region specified, using default region ID: 1");
        }

        // Set promotion if specified
        if (dto.getPromoId() != null) {
            Promotion promotion = promotionRepository.findById(dto.getPromoId())
                    .filter(p -> !p.getIsDeleted() && p.getEndDate().isAfter(LocalDate.now()))
                    .orElse(null);
            if (promotion != null) {
                booking.setPromo(promotion);
            }
        }

        // Save booking
        logger.info("Bắt đầu lưu booking...");
        Booking savedBooking = bookingRepository.save(booking);
        logger.info("Đã save booking vào DB, id={}", savedBooking.getId());

        // Tạo BookingFinancials trong transaction riêng biệt để tránh deadlock
        // Sử dụng @Async hoặc gọi sau khi transaction hiện tại commit
        try {
            // Gọi async để tránh deadlock
            createBookingFinancialsAsync(savedBooking.getId());
            logger.info("Successfully initiated BookingFinancials creation for booking ID: {}", savedBooking.getId());
        } catch (Exception e) {
            logger.error("Error creating BookingFinancials for booking ID: {}", savedBooking.getId(), e);
            // Không throw exception vì booking đã được tạo thành công
            // BookingFinancials có thể được tạo sau này khi cần thiết
        }

        return bookingMapper.toDTO(savedBooking);
    }

    // Phương thức async để tạo BookingFinancials
    @Async
    public void createBookingFinancialsAsync(Integer bookingId) {
        try {
            logger.info("Async: Bắt đầu tạo BookingFinancials cho booking ID: {}", bookingId);
            BookingDTO booking = findById(bookingId);
            financialsService.createOrUpdateFinancials(booking);
            logger.info("Async: Đã tạo BookingFinancials thành công cho booking ID: {}", bookingId);
        } catch (Exception e) {
            logger.error("Async: Lỗi khi tạo BookingFinancials cho booking ID: {}", bookingId, e);
        }
    }

    public BookingConfirmationDTO confirmBooking(BookingConfirmationDTO dto) {
        logger.info("Confirming booking for car ID: {}, pickupDateTime={}, dropoffDateTime={}",
            dto.getCarId(), dto.getPickupDateTime(), dto.getDropoffDateTime());

        if (!dto.getAgreeTerms()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must agree to the terms");
        }

        BookingDTO bookingDTO = new BookingDTO();
        bookingDTO.setCarId(dto.getCarId());
        bookingDTO.setUserId(dto.getUserId());
        bookingDTO.setPickupDateTime(dto.getPickupDateTime());
        bookingDTO.setDropoffDateTime(dto.getDropoffDateTime());
        bookingDTO.setPickupLocation(dto.getPickupLocation());
        bookingDTO.setDropoffLocation(dto.getDropoffLocation());
        bookingDTO.setStatusId(PENDING_STATUS_ID);
        bookingDTO.setWithDriver(dto.getWithDriver());
        bookingDTO.setDeliveryRequested(dto.getDeliveryRequested());

        if (dto.getPromoCode() != null) {
            Promotion promo = promotionRepository.findByCode(dto.getPromoCode())
                    .filter(p -> !p.getIsDeleted() && p.getEndDate().isAfter(ChronoLocalDate.from(LocalDateTime.now())))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired promo code"));
            bookingDTO.setPromoId(promo.getId());
        }

        BookingDTO savedBooking = save(bookingDTO);

        PriceBreakdownDTO priceBreakdown = financialsService.calculatePriceBreakdown(savedBooking);
        dto.setBookingId(savedBooking.getBookingId());
        dto.setPriceBreakdown(priceBreakdown);

        return dto;
    }

    public BookingDTO update(Integer id, BookingDTO dto) {
        logger.info("Updating booking with id: {}", id);
        Booking booking = bookingRepository.findById(id)
                .filter(b -> !b.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or has been deleted."));

        LocalDate startDate = dto.getPickupDateTime() != null ? dto.getPickupDateTime().toLocalDate() : booking.getStartDate();
        LocalDate endDate = dto.getDropoffDateTime() != null ? dto.getDropoffDateTime().toLocalDate() : booking.getEndDate();
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date range");
        }

        if (dto.getCarId() != null) {
            Car car = carRepository.findById(dto.getCarId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
            if (car.getStatus().getId() != AVAILABLE_STATUS_ID) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Car is not available");
            }
            booking.setCar(car);
        }

        if (dto.getPickupLocation() != null) booking.setPickupLocation(dto.getPickupLocation());
        if (dto.getDropoffLocation() != null) booking.setDropoffLocation(dto.getDropoffLocation());
        if (startDate != null) booking.setStartDate(startDate);
        if (endDate != null) booking.setEndDate(endDate);

        booking.setUpdatedAt(Instant.now());
        Booking updatedBooking = bookingRepository.save(booking);
        return bookingMapper.toDTO(updatedBooking);
    }

    public void delete(Integer id) {
        logger.info("Deleting booking with id: {}", id);
        Booking booking = bookingRepository.findById(id)
                .filter(b -> !b.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or has been deleted."));
        booking.setIsDeleted(true);
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);
    }

    public List<BookingDTO> getBookingsByCustomerId(Integer customerId) {
        logger.info("Fetching bookings for customerId: {}", customerId);
        return bookingRepository.findByCustomerIdAndIsDeleted(customerId, false)
                .stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingDTO findByIdWithDetails(Integer bookingId) {
        logger.info("Fetching booking with id: {}", bookingId);

        try {
            // Sử dụng query với JOIN để eager load
            Optional<Booking> bookingOpt = bookingRepository.findByIdWithAllDetails(bookingId);

            if (bookingOpt.isEmpty()) {
                throw new RuntimeException("Không tìm thấy booking với ID: " + bookingId);
            }

            Booking booking = bookingOpt.get();
            BookingDTO dto = bookingMapper.toDTO(booking);

            logger.info("Successfully fetched booking details: {}", dto.getBookingId());
            return dto;

        } catch (Exception e) {
            logger.error("Error fetching booking with id: {}", bookingId, e);
            throw new RuntimeException("Không thể tải chi tiết đặt xe");
        }
    }

    @Transactional
    public BookingDTO cancelBooking(Integer bookingId) {
        logger.info("Cancelling booking with id: {}", bookingId);
        
        try {
            // Tìm booking
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với ID: " + bookingId));
            
            // Kiểm tra trạng thái có thể hủy
            String currentStatus = booking.getStatus().getStatusName();
            if (!"confirmed".equals(currentStatus) && !"pending".equals(currentStatus)) {
                throw new RuntimeException("Không thể hủy booking với trạng thái: " + currentStatus);
            }
            
            // Tìm cancelled status - DÙNG ID thay vì tạo mới
            Status cancelledStatus = statusRepository.findById(CANCELLED_STATUS_ID)
                    .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy trạng thái cancelled"));
            
            // Cập nhật trạng thái
            booking.setStatus(cancelledStatus);
            
            // Lưu booking
            Booking savedBooking = bookingRepository.save(booking);
            
            logger.info("Successfully cancelled booking: {}", bookingId);
            return bookingMapper.toDTO(savedBooking);
            
        } catch (Exception e) {
            logger.error("Error cancelling booking: {}", bookingId, e);
            throw new RuntimeException("Không thể hủy đặt xe: " + e.getMessage());
        }
    }

    @Transactional
    public void ensureBookingFinancials(Integer bookingId) {
        logger.info("Ensuring financials for booking ID: {}", bookingId);
        try {
            BookingDTO booking = findById(bookingId);
            financialsService.createOrUpdateFinancials(booking);
            logger.info("Successfully ensured financials for booking ID: {}", bookingId);
        } catch (Exception e) {
            logger.error("Error ensuring financials for booking ID: {}", bookingId, e);
            throw new RuntimeException("Failed to ensure booking financials", e);
        }
    }

    /**
     * Lấy userId từ username
     */
    public Integer getUserIdByUsername(String username) {
        logger.info("Getting userId for username: {}", username);
        User user = userRepository.findByUsernameOrEmail(username, username)
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "User not found with username: " + username));
        logger.info("Found userId: {} for username: {}", user.getId(), username);
        return user.getId();
    }

}
