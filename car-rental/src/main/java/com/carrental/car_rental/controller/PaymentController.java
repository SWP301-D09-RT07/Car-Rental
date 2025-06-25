package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.PaymentDTO;
import com.carrental.car_rental.dto.PaymentResponseDTO;
import com.carrental.car_rental.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO> getPayment(@PathVariable Integer id) {
        logger.info("Request to get payment by ID: {}", id);
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        logger.info("Request to get all payments");
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByBookingId(@PathVariable Integer bookingId) {
        logger.info("Request to get payments for booking ID: {}", bookingId);
        return ResponseEntity.ok(service.findByBookingId(bookingId));
    }

    @PostMapping
    public ResponseEntity<PaymentResponseDTO> createPayment(@Valid @RequestBody PaymentDTO dto, HttpServletRequest request) {
        logger.info("Request to create payment for booking ID: {}", dto.getBookingId());
        try {
            PaymentResponseDTO response = service.processPayment(dto, request);
            logger.info("Payment processed with ID: {}", response.getPaymentId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid payment data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error processing payment: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/create")
    public ResponseEntity<PaymentResponseDTO> initiatePayment(@Valid @RequestBody PaymentDTO dto, HttpServletRequest request) {
        logger.info("Request to initiate payment for booking ID: {}", dto.getBookingId());
        try {
            PaymentResponseDTO response = service.processPayment(dto, request);
            logger.info("Payment initiated with ID: {}", response.getPaymentId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid payment data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error initiating payment: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable Integer id, @Valid @RequestBody PaymentDTO dto) {
        logger.info("Request to update payment with ID: {}", id);
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Integer id) {
        logger.warn("Request to delete payment with ID: {}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> handlePaymentCallback(HttpServletRequest request) {
        logger.info("Payment callback received for TxnRef: {}", request.getParameter("vnp_TxnRef"));
        try {
            service.handlePaymentCallback(request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            logger.error("Invalid callback data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            logger.error("Error handling payment callback: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}