package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.BookingConfirmationDTO;
import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.dto.BookingCreateDTO;
import com.carrental.car_rental.dto.BookingUpdateDTO;
import com.carrental.car_rental.service.BookingService;
import com.carrental.car_rental.service.BookingFinancialsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
        BookingFinancialsDTO dto = financialsService.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài chính booking"));
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(@Valid @RequestBody BookingCreateDTO dto) {
        logger.info("Request to create a new booking for car ID: {}", dto.getCarId());
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.save(dto));
    }

    @PostMapping("/confirm")
    public ResponseEntity<BookingConfirmationDTO> confirmBooking(@Valid @RequestBody BookingCreateDTO dto) {
        logger.info("Request to confirm booking for car ID: {}", dto.getCarId());
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
    public ResponseEntity<BookingDTO> updateBooking(@PathVariable Integer id, @Valid @RequestBody BookingUpdateDTO dto) {
        logger.info("Request to update booking with ID: {}", id);
        return ResponseEntity.ok(bookingService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Integer id) {
        logger.warn("Request to delete booking with ID: {}", id);
        bookingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
