package com.carrental.car_rental.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class BookingDTO {
    private Integer id;
    private String vehicleName;
    private String customerName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private BigDecimal totalAmount;
}