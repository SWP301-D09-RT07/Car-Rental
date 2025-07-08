package com.carrental.car_rental.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FavoriteDTO {
    private Integer favoriteId;
    private Integer userId;
    private Integer carId;
    private Integer supplierId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}