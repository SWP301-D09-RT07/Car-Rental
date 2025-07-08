package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Integer> {
    List<Rating> findByBookingIdAndIsDeletedFalse(Integer bookingId);
    List<Rating> findByCarIdAndIsDeletedFalse(Integer carId);
    List<Rating> findByBookingCarIdAndIsDeletedFalse(Integer carId);
    @Query("SELECT r.ratingScore as stars, " +
            "CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS INTEGER) as percentage, " +
            "COUNT(*) as count " +
            "FROM Rating r " +
            "WHERE r.car.id = :carId AND r.isDeleted = false " +
            "GROUP BY r.ratingScore")
    List<RatingSummaryProjection> findRatingSummaryByCarId(Integer carId);
}
