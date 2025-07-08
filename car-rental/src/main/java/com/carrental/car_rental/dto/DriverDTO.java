package com.carrental.car_rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverDTO {
    private Integer driverId;
    private Integer bookingId;
    private Integer userId;
    private String licenseNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}