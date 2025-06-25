package com.carrental.car_rental.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingCreateDTO {
    private Integer carId;
    private Integer userId;
    private String pickupLocation;
    private String dropoffLocation;
    private LocalDateTime pickupDateTime;
    private LocalDateTime dropoffDate;
    private Integer promoId;
    // Có thể bổ sung các trường khác nếu cần
} 