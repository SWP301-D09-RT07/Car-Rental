package com.carrental.car_rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceDTO {
    private Integer insuranceId;
    private Integer bookingId;
    private String insuranceType;
    private BigDecimal insuranceCost;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}