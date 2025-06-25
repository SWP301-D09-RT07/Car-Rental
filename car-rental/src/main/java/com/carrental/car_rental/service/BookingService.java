package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.BookingConfirmationDTO;
import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.dto.BookingCreateDTO;
import com.carrental.car_rental.dto.BookingUpdateDTO;
import com.carrental.car_rental.dto.PriceBreakdownDTO;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.mapper.BookingMapper;
import com.carrental.car_rental.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.chrono.ChronoLocalDate;
import java.util.List;
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
            PromotionRepository promotionRepository) {
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
    }

    public BookingDTO findById(Integer id) {
        logger.info("Fetching booking with id: {}", id);
        Booking booking = bookingRepository.findById(id)
                .filter(b -> !b.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or has been deleted."));
        return bookingMapper.toDTO(booking);
    }

    public List<BookingDTO> findAll() {
        logger.info("Fetching all bookings");
        return bookingRepository.findAllByIsDeletedFalse()
                .stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> findByUserId(Integer userId) {
        logger.info("Fetching bookings for userId: {}", userId);
        return bookingRepository.findByCustomerIdAndIsDeleted(userId, false)
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

    public BookingDTO save(BookingCreateDTO dto) {
        logger.info("Saving new booking with DTO: carId={}, pickupLocation={}, dropoffLocation={}",
                dto.getCarId(), dto.getPickupLocation(), dto.getDropoffLocation());

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Car car = carRepository.findById(dto.getCarId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
        if (car.getStatus().getId() != AVAILABLE_STATUS_ID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Car is not available");
        }

        LocalDate startDate = dto.getPickupDateTime() != null ? dto.getPickupDateTime().toLocalDate() : null;
        LocalDate endDate = dto.getDropoffDate() != null ? dto.getDropoffDate().toLocalDate() : null;
        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date range");
        }

        boolean hasValidInsurance = insuranceRepository.findByCarIdAndIsDeleted(dto.getCarId(), false)
                .stream()
                .anyMatch(i -> !i.getIsDeleted() && !i.getEndDate().isBefore(startDate));
        if (!hasValidInsurance) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Car is not available: no valid insurance for the selected dates.");
        }

        boolean hasMaintenanceConflict = maintenanceRepository.findByCarIdAndIsDeleted(dto.getCarId(), false)
                .stream()
                .anyMatch(m -> !m.getIsDeleted() && !m.getEndDate().isBefore(startDate) && !m.getStartDate().isAfter(endDate));
        if (hasMaintenanceConflict) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Car is not available: maintenance scheduled during the selected dates.");
        }

        boolean hasBookingConflict = bookingRepository.findByCarIdAndIsDeleted(dto.getCarId(), false)
                .stream()
                .anyMatch(b -> !b.getIsDeleted() && b.getStatus().getId() != CANCELLED_STATUS_ID && b.getStatus().getId() != COMPLETED_STATUS_ID
                        && !b.getEndDate().isBefore(startDate) && !b.getStartDate().isAfter(endDate));
        if (hasBookingConflict) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Car is not available: conflicting booking found.");
        }

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setCar(car);
        booking.setPickupLocation(dto.getPickupLocation());
        booking.setDropoffLocation(dto.getDropoffLocation());
        booking.setStartDate(startDate);
        booking.setEndDate(endDate);
        booking.setStatus(statusRepository.findById(PENDING_STATUS_ID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Status 'pending' not found")));
        booking.setBookingDate(Instant.now());
        booking.setCreatedAt(Instant.now());
        booking.setUpdatedAt(Instant.now());
        booking.setIsDeleted(false);
        booking.setDepositAmount(BigDecimal.ZERO);
        booking.setSeatNumber((short) 0);

        booking.setDriver(driverRepository.findById(1)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Default driver not found")));
        booking.setRegion(regionRepository.findById(1)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Default region not found")));

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

        BookingFinancialsDTO financialsDTO = financialsService.calculateFinancials(savedBooking);
        financialsService.save(financialsDTO);

        return bookingMapper.toDTO(savedBooking);
    }

    public BookingConfirmationDTO confirmBooking(BookingCreateDTO dto) {
        logger.info("Confirming booking for car ID: {}", dto.getCarId());
        BookingDTO savedBooking = save(dto);
        BookingConfirmationDTO confirmation = new BookingConfirmationDTO();
        confirmation.setBookingId(savedBooking.getBookingId());
        return confirmation;
    }

    public BookingDTO update(Integer id, BookingUpdateDTO dto) {
        logger.info("Updating booking with id: {}", id);
        Booking booking = bookingRepository.findById(id)
                .filter(b -> !b.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or has been deleted."));

        if (dto.getCarId() != null) {
            Car car = carRepository.findById(dto.getCarId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
            booking.setCar(car);
        }
        if (dto.getPickupLocation() != null) booking.setPickupLocation(dto.getPickupLocation());
        if (dto.getDropoffLocation() != null) booking.setDropoffLocation(dto.getDropoffLocation());
        if (dto.getPickupDateTime() != null) booking.setStartDate(dto.getPickupDateTime().toLocalDate());
        if (dto.getDropoffDate() != null) booking.setEndDate(dto.getDropoffDate().toLocalDate());
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
}
