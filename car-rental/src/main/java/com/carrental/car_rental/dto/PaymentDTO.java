package com.carrental.car_rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
}