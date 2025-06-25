package com.carrental.car_rental.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingUpdateDTO {
    private Integer carId;
    private String pickupLocation;
    private String dropoffLocation;
    private LocalDateTime pickupDateTime;
    private LocalDateTime dropoffDate;
    // Có thể bổ sung các trường khác nếu cần
} 