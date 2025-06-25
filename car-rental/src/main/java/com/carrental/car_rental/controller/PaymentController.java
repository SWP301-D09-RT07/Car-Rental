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
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.validation.Valid;
import java.net.URI;
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
    public ResponseEntity<Void> handlePaymentCallback(HttpServletRequest request, UriComponentsBuilder uriBuilder) {
        logger.info("Payment callback received for TxnRef: {}", request.getParameter("vnp_TxnRef"));
        String frontendUrl = "http://localhost:5173"; // URL của ứng dụng React

        try {
            String txnRef = service.handlePaymentCallback(request);
            String responseCode = request.getParameter("vnp_ResponseCode");

            UriComponentsBuilder redirectUriBuilder;

            if ("00".equals(responseCode)) {
                // Thanh toán thành công -> chuyển hướng về trang success
                redirectUriBuilder = UriComponentsBuilder.fromUriString(frontendUrl)
                        .path("/booking-success")
                        .queryParam("payment_status", "success")
                        .queryParam("txn_ref", txnRef);
            } else {
                // Thanh toán thất bại -> chuyển hướng về trang failure
                redirectUriBuilder = UriComponentsBuilder.fromUriString(frontendUrl)
                        .path("/payment-failed") // Một trang thất bại chung
                        .queryParam("payment_status", "failed")
                        .queryParam("error_code", responseCode);
            }

            URI redirectUri = redirectUriBuilder.build().toUri();
            return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();

        } catch (Exception e) {
            logger.error("Error handling payment callback: {}", e.getMessage(), e);
            // Lỗi server -> chuyển hướng về trang failure
            URI redirectUri = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/payment-failed")
                    .queryParam("payment_status", "failed")
                    .queryParam("error_code", "server_error")
                    .build().toUri();
            return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();
        }
    }

    @PostMapping("/test-cash")
    public ResponseEntity<PaymentResponseDTO> testCashPayment(@RequestBody PaymentDTO dto) {
        logger.info("Test cash payment for booking ID: {}", dto.getBookingId());
        try {
            // Tạo một mock response cho test
            PaymentResponseDTO response = new PaymentResponseDTO();
            response.setPaymentId(999);
            response.setBookingId(dto.getBookingId());
            response.setAmount(dto.getAmount());
            response.setCurrency("VND");
            response.setTransactionId("TEST_PAY_" + System.nanoTime());
            response.setPaymentMethod("cash");
            response.setStatus("success");
            response.setPaymentDate(java.time.LocalDateTime.now());
            
            logger.info("Test cash payment successful: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Test cash payment failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        logger.info("Payment service test endpoint called");
        return ResponseEntity.ok("Payment service is running");
    }
}