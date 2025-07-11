package com.carrental.car_rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private Integer bookingId;
    private Integer userId; // Maps to Booking.customer_id
    private Integer carId; // Maps to Booking.car_id
    private String carLicensePlate;
    private Integer driverId; // Maps to Booking.driver_id
    private Integer regionId; // Maps to Booking.region_id
    private LocalDateTime bookingDate; // Maps to Booking.bookingDate
    private String pickupLocation; // Maps to Booking.pickup_location
    private String dropoffLocation; // Maps to Booking.dropoff_location
    private LocalDateTime pickupDateTime; // Maps to Booking.startDate
    private LocalDateTime dropoffDate; // Maps to Booking.endDate
    private Short seatNumber; // Maps to Booking.seat_number
    private BigDecimal depositAmount; // Maps to Booking.deposit_amount
    private Integer promoId; // Maps to Booking.promo_id
    private Integer extensionDays; // Maps to Booking.extension_days
    private Integer extensionStatusId; // Maps to Booking.extension_status_id
    private Integer statusId; // Maps to Booking.status_id
    private String statusName;
    private LocalDateTime createdAt; // Maps to Booking.created_at
    private LocalDateTime updatedAt; // Maps to Booking.updated_at
    private Boolean withDriver; // Indicates if driver is requested (derived from driverId)
    private Boolean deliveryRequested; // Indicates if delivery is requested
    private Integer estimatedOvertimeHours; // Estimated overtime in hours
}