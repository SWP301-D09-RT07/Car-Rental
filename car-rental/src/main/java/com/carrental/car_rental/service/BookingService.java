package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.*;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.mapper.BookingMapper;
import com.carrental.car_rental.mapper.UserMapper;
import com.carrental.car_rental.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import com.carrental.car_rental.mapper.RatingMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.chrono.ChronoLocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
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
    private final RatingRepository ratingRepository;
    private final UserMapper userMapper;
    private final RatingMapper ratingMapper;

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
            PaymentRepository paymentRepository,
            RatingRepository ratingRepository, UserMapper userMapper, RatingMapper ratingMapper) {
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
        this.ratingRepository = ratingRepository;
        this.userMapper = userMapper;
        this.ratingMapper = ratingMapper;
    }

    @Transactional(readOnly = true)
    public BookingDTO findById(Integer id) {
        try {
            logger.info("Fetching booking with id: {}", id);
            Optional<Booking> bookingOpt = bookingRepository.findByIdWithAllRelations(id);
            if (bookingOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
            }
            Booking booking = bookingOpt.get();
            // mapping sang DTO ở đây, khi session vẫn còn mở
            return bookingMapper.toDTO(booking);
        } catch (Exception e) {
            logger.error("Error fetching booking with id: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching booking: " + e.getMessage());
        }
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
        try {
            // Sử dụng query với eager loading
            List<BookingDTO> bookingDTOs = bookingRepository.findByCustomerIdWithDetails(userId)
                    .stream()
                    .map(bookingMapper::toDTO)
                    .collect(Collectors.toList());
            // Bulk check hasRated để tối ưu performance
            if (!bookingDTOs.isEmpty()) {
                List<Integer> bookingIds = bookingDTOs.stream()
                    .map(BookingDTO::getBookingId)
                    .collect(Collectors.toList());
                List<Integer> ratedBookingIds = ratingRepository.findRatedBookingIds(bookingIds);
                Set<Integer> ratedSet = new HashSet<>(ratedBookingIds);
                // Set hasRated flag
                bookingDTOs.forEach(dto -> 
                    dto.setHasRated(ratedSet.contains(dto.getBookingId()))
                );
                logger.info("Set hasRated for {} bookings, {} have ratings", 
                    bookingDTOs.size(), ratedSet.size());
            }
            // Set tổng tiền cho từng booking
            bookingDTOs.forEach(dto -> {
                try {
                    BookingFinancialsDTO financials = financialsService.getOrCreateFinancials(dto);
                    if (financials != null && financials.getTotalFare() != null) {
                        dto.setTotalAmount(financials.getTotalFare());
                    }
                } catch (Exception e) {
                    dto.setTotalAmount(java.math.BigDecimal.ZERO);
                }
                // ✅ Đảm bảo set payment info cho từng booking
                loadPaymentInfo(dto, dto.getBookingId());
            });
            return bookingDTOs;
        } catch (Exception e) {
            logger.error("Error fetching bookings for userId: {}", userId, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Error fetching user bookings: " + e.getMessage());
        }
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
        Instant startInstant = dto.getPickupDateTime().atZone(java.time.ZoneId.systemDefault()).toInstant();
        Instant endInstant = dto.getDropoffDateTime().atZone(java.time.ZoneId.systemDefault()).toInstant();
        List<Booking> conflictingBookings = bookingRepository.findByCarIdAndOverlappingDates(
            dto.getCarId(), startInstant, endInstant);
        
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
        // SỬA: Chuyển LocalDateTime -> Instant khi set vào entity
        booking.setStartDate(dto.getPickupDateTime() != null ? dto.getPickupDateTime().atZone(java.time.ZoneId.systemDefault()).toInstant() : null);
        booking.setEndDate(dto.getDropoffDateTime() != null ? dto.getDropoffDateTime().atZone(java.time.ZoneId.systemDefault()).toInstant() : null);
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

        if (dto.getPromoId() != null) {
            Promotion promo = promotionRepository.findById(dto.getPromoId())
                    .filter(p -> !p.getIsDeleted() && p.getEndDate().isAfter(ChronoLocalDate.from(LocalDateTime.now())))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired promotion"));
            booking.setPromo(promo);
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

        LocalDateTime startDate = dto.getPickupDateTime();
        LocalDateTime endDate = dto.getDropoffDateTime();
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
        // SỬA: Chuyển LocalDateTime -> Instant khi set vào entity
        if (startDate != null) booking.setStartDate(startDate.atZone(java.time.ZoneId.systemDefault()).toInstant());
        if (endDate != null) booking.setEndDate(endDate.atZone(java.time.ZoneId.systemDefault()).toInstant());

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
        
        try {
            List<BookingDTO> bookingDTOs = bookingRepository.findByCustomerIdAndIsDeleted(customerId, false)
                    .stream()
                    .map(bookingMapper::toDTO)
                    .collect(Collectors.toList());
            
            // Bulk check hasRated để tối ưu performance
            if (!bookingDTOs.isEmpty()) {
                List<Integer> bookingIds = bookingDTOs.stream()
                    .map(BookingDTO::getBookingId)
                    .collect(Collectors.toList());
                
                List<Integer> ratedBookingIds = ratingRepository.findRatedBookingIds(bookingIds);
                Set<Integer> ratedSet = new HashSet<>(ratedBookingIds);
                
                // Set hasRated flag
                bookingDTOs.forEach(dto -> 
                    dto.setHasRated(ratedSet.contains(dto.getBookingId()))
                );
            }
            
            return bookingDTOs;
            
        } catch (Exception e) {
            logger.error("Error fetching bookings for customerId: {}", customerId, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Error fetching customer bookings: " + e.getMessage());
        }
    }

@Transactional(readOnly = true)
public BookingDTO findByIdWithDetails(Integer bookingId) {
    logger.info("🔍 Fetching booking with id: {}", bookingId);
    try {
        Optional<Booking> bookingOpt = bookingRepository.findByIdWithAllRelations(bookingId);
        if (bookingOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy booking với ID: " + bookingId);
        }
        Booking booking = bookingOpt.get();
        BookingDTO dto = bookingMapper.toDTO(booking);
        // Set tổng tiền từ BookingFinancialsService
        try {
            BookingFinancialsDTO financials = financialsService.getOrCreateFinancials(dto);
            if (financials != null && financials.getTotalFare() != null) {
                dto.setTotalAmount(financials.getTotalFare());
            }
        } catch (Exception e) {
            dto.setTotalAmount(java.math.BigDecimal.ZERO);
        }
        if (booking.getCar() != null) {
            dto.setCarModel(booking.getCar().getModel());
            dto.setCarLicensePlate(booking.getCar().getLicensePlate());
            dto.setSeatNumber(booking.getCar().getNumOfSeats());
            logger.info("🚗 Car info loaded: model={}, plate={}, seats={}", 
                dto.getCarModel(), dto.getCarLicensePlate(), dto.getSeatNumber());
        } else {
            logger.warn("⚠️ No car info found for booking {}", bookingId);
        }
        // ✅ Load payment info sử dụng helper method
        loadPaymentInfo(dto, bookingId);
        // ✅ THÊM: Load detailed payment information - ĐƠN GIẢN
        List<PaymentDTO> paymentDetails = getBookingPaymentDetails(bookingId);
        dto.setPaymentDetails(paymentDetails);
        logger.info("✅ Loaded {} payment records for booking {}", paymentDetails.size(), bookingId);
        // Check hasRated
        boolean hasRated = ratingRepository.existsByBookingId(bookingId);
        dto.setHasRated(hasRated);
        logger.info("✅ Successfully fetched booking details: {}, hasRated: {}, paymentStatus: {}", 
            dto.getBookingId(), hasRated, dto.getPaymentStatus());
        return dto;
    } catch (Exception e) {
        logger.error("❌ Error fetching booking with id: {}", bookingId, e);
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
   
    private void setHasRatedFlags(List<BookingDTO> bookingDTOs) {
    if (bookingDTOs.isEmpty()) {
        return;
    }
    
    try {
        List<Integer> bookingIds = bookingDTOs.stream()
            .map(BookingDTO::getBookingId)
            .collect(Collectors.toList());
        
        List<Integer> ratedBookingIds = ratingRepository.findRatedBookingIds(bookingIds);
        Set<Integer> ratedSet = new HashSet<>(ratedBookingIds);
        
        // Set hasRated flag
        bookingDTOs.forEach(dto -> 
            dto.setHasRated(ratedSet.contains(dto.getBookingId()))
        );
        
        logger.debug("Set hasRated for {} bookings, {} have ratings", 
            bookingDTOs.size(), ratedSet.size());
            
    } catch (Exception e) {
        logger.error("Error setting hasRated flags", e);
        // Set default false if error
        bookingDTOs.forEach(dto -> dto.setHasRated(false));
    }
    }
    @Transactional
public BookingDTO confirmDelivery(Integer bookingId, Boolean isSupplier) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    
    if (isSupplier) {
        booking.setSupplierDeliveryConfirm(true);
    } else {
        booking.setCustomerReceiveConfirm(true);
    }
    
    // Nếu cả hai bên đều confirm thì set thời gian
    if (booking.getSupplierDeliveryConfirm() && booking.getCustomerReceiveConfirm()) {
        booking.setDeliveryConfirmTime(Instant.now());
    }
    
    return bookingMapper.toDTO(bookingRepository.save(booking));
}

@Transactional
public BookingDTO confirmReturn(Integer bookingId, Boolean isSupplier) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    
    if (isSupplier) {
        booking.setSupplierReturnConfirm(true);
    } else {
        
        booking.setCustomerReturnConfirm(true);
    }
    
    // Nếu cả hai bên đều confirm thì set thời gian
    if (booking.getCustomerReturnConfirm() && booking.getSupplierReturnConfirm()) {
        booking.setReturnConfirmTime(Instant.now());
    }
    
    return bookingMapper.toDTO(bookingRepository.save(booking));
}
   
 public List<BookingDTO> getUserBookingHistory(Integer userId) {
    logger.info("🔍 Getting booking history for userId: {}", userId);
    
    try {
        // ✅ Sử dụng repository method có sẵn
        List<Booking> bookings = bookingRepository.findByCustomerIdWithDetails(userId);
        logger.info("📋 Found {} raw bookings for user {}", bookings.size(), userId);
        
        List<BookingDTO> result = bookings.stream().map(booking -> {
            BookingDTO dto = bookingMapper.toDTO(booking);
            // ✅ THÊM: Load thông tin xe cho booking history
            if (booking.getCar() != null) {
                dto.setCarModel(booking.getCar().getModel());
                dto.setCarLicensePlate(booking.getCar().getLicensePlate());
                dto.setSeatNumber(booking.getCar().getNumOfSeats());
                
                logger.debug("🚗 Loaded car info: {} - {}", dto.getCarModel(), dto.getCarLicensePlate());
            }
            
            // ✅ THÊM: Load driver info nếu có
            if (booking.getDriver() != null && booking.getDriver().getId() != null) {
                dto.setDriverName(booking.getDriver().getDriverName());
            }

            // ✅ Load payment info cho từng booking
            loadPaymentInfo(dto, booking.getId());
            
            // ✅ Load hasRated flag
            boolean hasRated = ratingRepository.existsByBookingId(booking.getId());
            dto.setHasRated(hasRated);
            
            // Set tổng tiền từ BookingFinancialsService
            try {
                BookingFinancialsDTO financials = financialsService.getOrCreateFinancials(dto);
                if (financials != null && financials.getTotalFare() != null) {
                    dto.setTotalAmount(financials.getTotalFare());
                }
            } catch (Exception e) {
                dto.setTotalAmount(java.math.BigDecimal.ZERO);
            }
            
            // ✅ THÊM: Load ratings cho từng booking
            List<RatingDTO> ratings = ratingRepository.findByBookingIdAndCustomerIdAndIsDeletedFalse(booking.getId(), userId)
                .stream().map(ratingMapper::toDTO).collect(Collectors.toList());
            dto.setRatings(ratings != null ? ratings : new ArrayList<>());

            return dto;
        }).collect(Collectors.toList());
        
        logger.info("✅ Returning {} booking DTOs with payment info", result.size());
        return result;
        
    } catch (Exception e) {
        logger.error("❌ Error in getUserBookingHistory for user {}: {}", userId, e.getMessage(), e);
        throw new RuntimeException("Cannot fetch booking history: " + e.getMessage());
    }
}

// ✅ Helper method để load payment info (DRY principle)
// ✅ SỬA: Convert Instant to LocalDateTime đúng cách
private void loadPaymentInfo(BookingDTO dto, Integer bookingId) {
    try {
        List<Payment> payments = paymentRepository.findByBookingIdAndIsDeleted(bookingId, false);
        if (!payments.isEmpty()) {
            // Ưu tiên lấy payment mới nhất theo paymentDate, loại deposit trước, nếu không có thì full_payment
            Payment latestDeposit = payments.stream()
                .filter(p -> "deposit".equals(p.getPaymentType()))
                .max(Comparator.comparing(Payment::getPaymentDate))
                .orElse(null);
            Payment latestFull = payments.stream()
                .filter(p -> "full_payment".equals(p.getPaymentType()))
                .max(Comparator.comparing(Payment::getPaymentDate))
                .orElse(null);
            Payment latest = latestDeposit != null ? latestDeposit : latestFull;
            if (latest == null) {
                // fallback: lấy payment mới nhất bất kỳ
                latest = payments.stream()
                    .max(Comparator.comparing(Payment::getPaymentDate))
                    .orElse(payments.get(0));
            }
            String status = latest.getPaymentStatus().getStatusName();
            dto.setPaymentStatus(status);
            dto.setPaymentType(latest.getPaymentType());
            dto.setPaymentAmount("paid".equals(status) ? latest.getAmount() : BigDecimal.ZERO);
            if (latest.getPaymentDate() != null) {
                dto.setPaymentDate(LocalDateTime.ofInstant(latest.getPaymentDate(), ZoneId.systemDefault()));
            } else {
                dto.setPaymentDate(null);
            }
            dto.setHasFullPayment(
                payments.stream().anyMatch(p -> "full_payment".equals(p.getPaymentType()) && "paid".equals(p.getPaymentStatus().getStatusName()))
            );
            dto.setHasDeposit(
                payments.stream().anyMatch(p -> "deposit".equals(p.getPaymentType()) && "paid".equals(p.getPaymentStatus().getStatusName()))
            );
        } else {
            dto.setPaymentStatus("pending");
            dto.setPaymentType(null);
            dto.setPaymentAmount(null);
            dto.setPaymentDate(null);
            dto.setHasFullPayment(false);
            dto.setHasDeposit(false);
        }
    } catch (Exception e) {
        logger.error("💥 Error loading payment for booking {}: {}", bookingId, e.getMessage());
        dto.setPaymentStatus("error");
        dto.setPaymentType(null);
        dto.setPaymentAmount(null);
        dto.setPaymentDate(null);
        dto.setHasFullPayment(false);
        dto.setHasDeposit(false);
    }
}

// ✅ THÊM: Customer confirm delivery method
@Transactional
public BookingDTO customerConfirmDelivery(Integer bookingId, Integer customerId) {
    try {
        logger.info("🔄 Customer {} confirming delivery for booking {}", customerId, bookingId);
        
        // Validate booking exists and belongs to customer
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy booking với ID: " + bookingId);
        }
        
        Booking booking = bookingOpt.get();
        
        // Check ownership
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Bạn không có quyền xác nhận booking này");
        }
        
        // Check booking status
        if (!"confirmed".equals(booking.getStatus().getStatusName())) {
            throw new RuntimeException("Booking phải ở trạng thái 'confirmed' để xác nhận nhận xe");
        }
        
        // Check supplier has confirmed delivery
        if (!booking.getSupplierDeliveryConfirm()) {
            throw new RuntimeException("Supplier chưa xác nhận giao xe");
        }
        
        // Check customer hasn't confirmed yet
        if (booking.getCustomerReceiveConfirm()) {
            throw new RuntimeException("Bạn đã xác nhận nhận xe trước đó");
        }

        // Check payment status
        List<Payment> payments = paymentRepository.findByBookingIdAndIsDeleted(bookingId, false);
        boolean hasFullPayment = payments.stream()
            .anyMatch(p -> "full_payment".equals(p.getPaymentType()));
        
        if (!hasFullPayment) {
            throw new RuntimeException("Chưa thanh toán đầy đủ để nhận xe");
        }
        
        // Update booking
        booking.setCustomerReceiveConfirm(true);
        booking.setDeliveryConfirmTime(Instant.now());
        
        // Change status to 'in progress'
        Optional<Status> inProgressStatus = statusRepository.findByStatusName("in progress");
        if (inProgressStatus.isEmpty()) {
            // ✅ Fallback: sử dụng status ID trực tiếp
            inProgressStatus = statusRepository.findById(3); // Assuming in progress has ID = 3
        }
        if (inProgressStatus.isEmpty()) {
            // ✅ List all statuses để debug
            List<Status> allStatuses = statusRepository.findAll();
            logger.error("❌ Available statuses: {}", 
                allStatuses.stream().map(Status::getStatusName).collect(Collectors.toList()));
            throw new RuntimeException("Không tìm thấy status 'in progress' trong hệ thống");
        }
        logger.info("✅ Found status: {} with ID: {}", inProgressStatus.get().getStatusName(), inProgressStatus.get().getId());
        booking.setStatus(inProgressStatus.get());
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);
        
        logger.info("✅ Customer confirmed delivery for booking {}", bookingId);
        
        Booking savedBooking = bookingRepository.save(booking);
        logger.info("✅ Booking saved with new status: {} (ID: {})", 
            savedBooking.getStatus().getStatusName(), savedBooking.getStatus().getId());
        
        // ✅ Return updated booking DTO
        BookingDTO result = findByIdWithDetails(bookingId);
        logger.info("✅ Final result status: {}", result.getStatusName());
        
        return result;
        
    } catch (Exception e) {
        logger.error("❌ Error in customerConfirmDelivery: {}", e.getMessage(), e);
        throw new RuntimeException("Không thể xác nhận nhận xe: " + e.getMessage());
    }
}

// ✅ THÊM: Customer confirm return method
@Transactional
public BookingDTO customerConfirmReturn(Integer bookingId, Integer customerId) {
    try {
        logger.info("🔄 Customer {} confirming return for booking {}", customerId, bookingId);
        
        // Validate booking exists and belongs to customer
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy booking với ID: " + bookingId);
        }
        
        Booking booking = bookingOpt.get();
        
        // Check ownership
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Bạn không có quyền xác nhận booking này");
        }
        
        // Check booking status
        if (!"in progress".equals(booking.getStatus().getStatusName())) {
            throw new RuntimeException("Booking phải ở trạng thái 'in progress' để xác nhận trả xe");
        }
        
        // Check customer hasn't confirmed return yet
        if (booking.getCustomerReturnConfirm()) {
            throw new RuntimeException("Bạn đã xác nhận trả xe trước đó");
        }
        
        // Update booking
        booking.setCustomerReturnConfirm(true);
        booking.setReturnConfirmTime(Instant.now());
        booking.setUpdatedAt(Instant.now());
        
        bookingRepository.save(booking);
        
        logger.info("✅ Customer confirmed return for booking {}", bookingId);
        
        // Return updated booking DTO
        return findByIdWithDetails(bookingId);
        
    } catch (Exception e) {
        logger.error("❌ Error in customerConfirmReturn: {}", e.getMessage(), e);
        throw new RuntimeException("Không thể xác nhận trả xe: " + e.getMessage());
    }
}
// ✅ THÊM: Supplier confirm return method
@Transactional
public BookingDTO supplierConfirmReturn(Integer bookingId, Integer supplierId) {
    try {
        logger.info("🔄 Supplier {} confirming return for booking {}", supplierId, bookingId);
        
        // Validate booking exists
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy booking với ID: " + bookingId);
        }
        
        Booking booking = bookingOpt.get();
        
        // Check booking status
        if (!"in progress".equals(booking.getStatus().getStatusName())) {
            throw new RuntimeException("Booking phải ở trạng thái 'in progress' để xác nhận trả xe");
        }
        
        // Check customer đã trả xe
        if (!booking.getCustomerReturnConfirm()) {
            throw new RuntimeException("Customer chưa xác nhận trả xe");
        }
        
        // Check supplier chưa confirm
        if (booking.getSupplierReturnConfirm()) {
            throw new RuntimeException("Supplier đã xác nhận trả xe trước đó");
        }
        
        // Update booking
        booking.setSupplierReturnConfirm(true);
        booking.setReturnConfirmTime(Instant.now());
        
        // ✅ QUAN TRỌNG: Đổi status thành "completed"
        Optional<Status> completedStatus = statusRepository.findByStatusName("completed");
        if (completedStatus.isEmpty()) {
            // Fallback: sử dụng status ID
            completedStatus = statusRepository.findById(4); // Assuming completed has ID = 4
        }
        
        if (completedStatus.isPresent()) {
            booking.setStatus(completedStatus.get());
            logger.info("✅ Booking status changed to: {}", completedStatus.get().getStatusName());
        } else {
            logger.error("❌ Status 'completed' not found in system");
            throw new RuntimeException("Không tìm thấy status 'completed' trong hệ thống");
        }
        
        booking.setUpdatedAt(Instant.now());
        
        // Save booking
        Booking savedBooking = bookingRepository.save(booking);
        logger.info("✅ Supplier confirmed return for booking {} - Status: {}", 
            bookingId, savedBooking.getStatus().getStatusName());
        
        return findByIdWithDetails(bookingId);
        
    } catch (Exception e) {
        logger.error("❌ Error in supplierConfirmReturn: {}", e.getMessage(), e);
        throw new RuntimeException("Không thể xác nhận trả xe: " + e.getMessage());
    }
}
// ✅ SỬA: Method để lấy payment details cho booking sử dụng PaymentDTO
// ✅ SỬA: Method đơn giản hóa - không cần tính total
public List<PaymentDTO> getBookingPaymentDetails(Integer bookingId) {
    try {
        logger.info("🔍 Getting payment details for booking: {}", bookingId);
        
        List<Payment> payments = paymentRepository.findByBookingIdAndIsDeleted(bookingId, false);
        
        return payments.stream()
            .map(payment -> {
                PaymentDTO dto = new PaymentDTO();
                dto.setPaymentId(payment.getId());
                dto.setBookingId(payment.getBooking().getId());
                dto.setAmount(payment.getAmount());
                dto.setCurrency(payment.getRegion().getCurrency());
                dto.setTransactionId(payment.getTransactionId());
                dto.setPaymentMethod(payment.getPaymentMethod());
                dto.setPaymentType(payment.getPaymentType());
                
                if (payment.getPaymentDate() != null) {
                    dto.setPaymentDate(LocalDateTime.ofInstant(
                        payment.getPaymentDate(), 
                        ZoneId.systemDefault()
                    ));
                }
                
                if (payment.getPaymentStatus() != null) {
                    dto.setStatusName(payment.getPaymentStatus().getStatusName());
                }
                
                return dto;
            })
            .sorted(Comparator.comparing(PaymentDTO::getPaymentDate, Comparator.nullsLast(Comparator.naturalOrder())))
            .collect(Collectors.toList());
            
    } catch (Exception e) {
        logger.error("❌ Error getting payment details for booking {}: {}", bookingId, e.getMessage());
        return new ArrayList<>();
    }
}

    public List<BookingDTO> findRecentBookings(int size) {
        return bookingRepository.findAllByIsDeletedFalseOrderByBookingDateDesc(PageRequest.of(0, size))
                .stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Integer getNextBookingId() {
        return bookingRepository.getNextBookingId();
    }

    public List<UserDTO> findRecentBookingUsers(int size) {
        return bookingRepository.findRecentBookingUsers(PageRequest.of(0, size))
                .stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    // Scheduled job: Xóa booking failed quá 1 ngày
    @Scheduled(cron = "0 0 3 * * *") // chạy mỗi ngày lúc 3h sáng
    public void deleteFailedBookingsOlderThanOneDay() {
        logger.info("[Scheduled] Đang kiểm tra và xóa booking failed quá 1 ngày...");
        Status failedStatus = statusRepository.findByStatusName("failed").orElse(null);
        if (failedStatus == null) return;
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        List<Booking> failedBookings = bookingRepository.findByStatusAndCreatedAtBeforeAndIsDeletedFalse(failedStatus, oneDayAgo);
        for (Booking booking : failedBookings) {
            // Xóa payment liên quan
            List<Payment> payments = paymentRepository.findByBookingIdAndIsDeletedFalse(booking.getId());
            for (Payment payment : payments) {
                paymentRepository.delete(payment);
            }
            // Gửi email cho user
            try {
                String email = booking.getCustomer().getEmail();
                String subject = "Đơn đặt xe thất bại đã bị xóa";
                String content = "Chào " + booking.getCustomer().getUsername() + ",\n\n" +
                        "Đơn đặt xe #" + booking.getId() + " đã bị xóa khỏi hệ thống do không thanh toán thành công trong vòng 24h.\n" +
                        "Nếu bạn cần hỗ trợ, vui lòng liên hệ RentCar.";
                // Gửi email (giả lập, bạn có thể dùng service thực tế)
                logger.info("[Scheduled] Sending email to {}: {}", email, subject);
            } catch (Exception e) {
                logger.warn("[Scheduled] Không gửi được email thông báo xóa booking: {}", booking.getId());
            }
            // Log audit
            logger.info("[Scheduled] [AUDIT] Booking {} deleted by system at {} (auto cleanup)", booking.getId(), LocalDateTime.now());
            bookingRepository.delete(booking);
            logger.info("[Scheduled] Đã xóa cứng booking failed: {}", booking.getId());
        }

    }

    public void deleteAllPaymentsForBooking(Integer bookingId) {
        List<Payment> payments = paymentRepository.findByBookingIdAndIsDeletedFalse(bookingId);
        for (Payment payment : payments) {
            paymentRepository.delete(payment);
        }
    }

    // Method for admin dashboard
    public long count() {
        return bookingRepository.count();
    }

    public BigDecimal calculateTotalRevenue() {
        return bookingRepository.calculateTotalRevenue();
    }

}
