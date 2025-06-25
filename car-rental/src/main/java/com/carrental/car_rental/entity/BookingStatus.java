package com.carrental.car_rental.entity;

public enum BookingStatus {
    PENDING("Chờ xác nhận"),
    CONFIRMED("Đã xác nhận"),
    RENTING("Đang thuê"),
    COMPLETED("Đã trả"),
    CANCELLED("Đã hủy");

    private final String description;

    BookingStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 