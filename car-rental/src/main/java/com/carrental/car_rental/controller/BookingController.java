package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.BookingConfirmationDTO;
import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.dto.PriceBreakdownDTO;
import com.carrental.car_rental.service.BookingService;
import com.carrental.car_rental.service.BookingFinancialsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);
    private final BookingService bookingService;
    private final BookingFinancialsService financialsService;

    public BookingController(BookingService bookingService, BookingFinancialsService financialsService) {
        this.bookingService = bookingService;
        this.financialsService = financialsService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDTO> getBooking(@PathVariable Integer id) {
        logger.info("Request to get booking by ID: {}", id);
        return ResponseEntity.ok(bookingService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        logger.info("Request to get all bookings");
        return ResponseEntity.ok(bookingService.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByUserId(@PathVariable Integer userId) {
        logger.info("Request to get bookings for user ID: {}", userId);
        return ResponseEntity.ok(bookingService.findByUserId(userId));
    }

    @GetMapping("/car/{carId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByCarId(@PathVariable Integer carId) {
        logger.info("Request to get bookings for car ID: {}", carId);
        return ResponseEntity.ok(bookingService.findByCarId(carId));
    }

    @GetMapping("/{id}/financials")
    public ResponseEntity<BookingFinancialsDTO> getBookingFinancials(@PathVariable Integer id) {
        logger.info("Request to get financials for booking ID: {}", id);
        BookingDTO booking = bookingService.findById(id);
        return ResponseEntity.ok(financialsService.getOrCreateFinancials(booking));
    }

    @GetMapping("/{id}/price-breakdown")
    public ResponseEntity<PriceBreakdownDTO> getPriceBreakdown(@PathVariable Integer id) {
        logger.info("Request to get price breakdown for booking ID: {}", id);
        BookingDTO booking = bookingService.findById(id);
        return ResponseEntity.ok(financialsService.calculatePriceBreakdown(booking));
    }

    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(@Valid @RequestBody BookingDTO dto) {
        logger.info("Request to create a new booking for car ID: {}", dto.getCarId());
        logger.info("Request data: {}", dto);
        
        // Lấy userId từ authentication context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.error("User not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String username = authentication.getName();
        logger.info("Authenticated user: {}", username);
        
        // Lấy userId từ username (cần implement method này trong UserService)
        try {
            Integer userId = bookingService.getUserIdByUsername(username);
            dto.setUserId(userId);
            logger.info("Set userId: {} for username: {}", userId, username);
        } catch (Exception e) {
            logger.error("Error getting userId for username: {}", username, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        
        try {
            logger.info("Calling bookingService.save with DTO: {}", dto);
            BookingDTO savedBooking = bookingService.save(dto);
            logger.info("Booking saved successfully with ID: {}", savedBooking.getBookingId());
            logger.info("Returning response: {}", savedBooking);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
        } catch (Exception e) {
            logger.error("Error saving booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<BookingConfirmationDTO> confirmBooking(@Valid @RequestBody BookingConfirmationDTO dto) {
        logger.info("Request to confirm booking for car ID: {}", dto.getCarId());
        
        // Lấy userId từ authentication context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.error("User not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String username = authentication.getName();
        logger.info("Authenticated user: {}", username);
        
        // Lấy userId từ username
        try {
            Integer userId = bookingService.getUserIdByUsername(username);
            dto.setUserId(userId);
            logger.info("Set userId: {} for username: {}", userId, username);
        } catch (Exception e) {
            logger.error("Error getting userId for username: {}", username, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        
        try {
            BookingConfirmationDTO confirmedBooking = bookingService.confirmBooking(dto);
            logger.info("Booking confirmed with ID: {}", confirmedBooking.getBookingId());
            return ResponseEntity.status(HttpStatus.CREATED).body(confirmedBooking);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid booking data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error confirming booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingDTO> updateBooking(@PathVariable Integer id, @Valid @RequestBody BookingDTO dto) {
        logger.info("Request to update booking with ID: {}", id);
        return ResponseEntity.ok(bookingService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Integer id) {
        logger.warn("Request to delete booking with ID: {}", id);
        bookingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-payment/{transactionId}")
    public ResponseEntity<BookingDTO> getBookingByTransactionId(@PathVariable String transactionId) {
        logger.info("Request to get booking by transaction ID: {}", transactionId);
        try {
            BookingDTO bookingDTO = bookingService.findByTransactionId(transactionId);
            return ResponseEntity.ok(bookingDTO);
        } catch (Exception e) {
            logger.error("Error getting booking by transaction ID: {}", transactionId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/{id}/ensure-financials")
    public ResponseEntity<Void> ensureBookingFinancials(@PathVariable Integer id) {
        logger.info("Request to ensure financials for booking ID: {}", id);
        bookingService.ensureBookingFinancials(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        logger.info("Test connection endpoint called");
        return ResponseEntity.ok("Booking service is working!");
    }

    @PostMapping("/test-auth")
    public ResponseEntity<String> testAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        String username = authentication.getName();
        logger.info("Test auth endpoint called by user: {}", username);
        return ResponseEntity.ok("Authenticated as: " + username);
    }
}
