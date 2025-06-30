package com.carrental.car_rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private Integer paymentId;
    private Integer bookingId;
    private BigDecimal amount;
    private String currency;
    private String transactionId;
    private String paymentMethod;
    private String statusName;
    private LocalDateTime paymentDate;
    private String paymentType; // "deposit", "full_payment", "refund"
    
    // Booking-related fields for creating temporary booking
    private Integer carId;
    private LocalDateTime pickupDateTime;
    private LocalDateTime dropoffDateTime;
    private String pickupLocation;
    private String dropoffLocation;
    private Short seatNumber;
    private Boolean withDriver;
    private Boolean deliveryRequested;
    
    // User information
    private Integer userId;
    private Map<String, Object> customerInfo;
}