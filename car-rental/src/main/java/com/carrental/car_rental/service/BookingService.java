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
import org.springframework.data.domain.PageRequest;
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

import org.springframework.beans.factory.annotation.Autowired;
import com.carrental.car_rental.mapper.UserMapper;
import com.carrental.car_rental.dto.UserDTO;

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
    private final UserMapper userMapper;

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
            UserMapper userMapper) {
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
        this.userMapper = userMapper;
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

    public BookingDTO save(BookingDTO dto) {
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

        if (dto.getPromoId() != null) {
            Promotion promo = promotionRepository.findById(dto.getPromoId())
                    .filter(p -> !p.getIsDeleted() && p.getEndDate().isAfter(ChronoLocalDate.from(LocalDateTime.now())))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired promotion"));
            booking.setPromo(promo);
        }

        Booking savedBooking = bookingRepository.save(booking);

        BookingFinancialsDTO financialsDTO = financialsService.calculateFinancials(bookingMapper.toDTO(savedBooking));
        financialsService.save(financialsDTO);

        return bookingMapper.toDTO(savedBooking);
    }

    public BookingConfirmationDTO confirmBooking(BookingConfirmationDTO dto) {
        logger.info("Confirming booking for car ID: {}", dto.getCarId());

        if (!dto.getAgreeTerms()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must agree to the terms");
        }

        BookingDTO bookingDTO = new BookingDTO();
        bookingDTO.setCarId(dto.getCarId());
        bookingDTO.setUserId(dto.getUserId());
        bookingDTO.setPickupDateTime(dto.getPickupDateTime());
        bookingDTO.setDropoffDate(dto.getDropoffDate());
        bookingDTO.setPickupLocation(dto.getPickupLocation());
        bookingDTO.setDropoffLocation(dto.getDropoffLocation());
        bookingDTO.setStatusId(PENDING_STATUS_ID);

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
        LocalDate endDate = dto.getDropoffDate() != null ? dto.getDropoffDate().toLocalDate() : booking.getEndDate();
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

    // Lấy booking gần đây nhất (của hoàng)
    public List<BookingDTO> findRecentBookings(int size) {
        return bookingRepository.findAllByIsDeletedFalseOrderByBookingDateDesc(PageRequest.of(0, size))
            .stream()
            .map(bookingMapper::toDTO)
            .collect(Collectors.toList());
    }

    // Lấy user có booking gần đây nhất (của hoàng)
    public List<UserDTO> findRecentBookingUsers(int size) {
        return bookingRepository.findRecentBookingUsers(PageRequest.of(0, size))
            .stream()
            .map(userMapper::toDto)
            .collect(Collectors.toList());
    }
}
