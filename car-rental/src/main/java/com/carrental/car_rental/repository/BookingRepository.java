package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Booking;
import com.carrental.car_rental.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByCustomerIdAndIsDeleted(Integer customerId, boolean isDeleted);

    @Query("SELECT b FROM Booking b WHERE b.car.id = :carId AND b.isDeleted = :isDeleted")
    List<Booking> findByCarIdAndIsDeleted(Integer carId, boolean isDeleted);

    List<Booking> findAllByIsDeletedFalse();

    List<Booking> findByCarId(Integer carId);

    @Query("SELECT b FROM Booking b WHERE b.car.id = :carId AND b.status.statusName != 'cancelled' " +
            "AND ((b.startDate <= :endDate AND b.endDate >= :startDate))")
    List<Booking> findByCarIdAndOverlappingDates(
            @Param("carId") Integer carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Lấy booking gần đây nhất (của hoàng)
    List<Booking> findAllByIsDeletedFalseOrderByBookingDateDesc(Pageable pageable);

    @Query("SELECT DISTINCT b.customer FROM Booking b WHERE b.isDeleted = false ORDER BY b.bookingDate DESC")
    List<User> findRecentBookingUsers(Pageable pageable);
}