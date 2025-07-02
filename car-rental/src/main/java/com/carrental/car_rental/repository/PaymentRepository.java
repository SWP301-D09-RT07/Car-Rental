package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByBookingIdAndIsDeletedFalse(Integer bookingId);
    Optional<Payment> findByTransactionIdAndIsDeletedFalse(String transactionId);

     @Query("SELECT p FROM Payment p WHERE p.booking.id = :bookingId AND p.isDeleted = false")
    Optional<Payment> findByBookingId(@Param("bookingId") Integer bookingId);
    
    // ✅ Tìm payment cuối cùng của booking (nếu có nhiều payment)
    @Query("SELECT p FROM Payment p WHERE p.booking.id = :bookingId AND p.isDeleted = false ORDER BY p.paymentDate DESC")
    Optional<Payment> findLatestByBookingId(@Param("bookingId") Integer bookingId);
    
    // ✅ Kiểm tra booking đã có payment chưa
    @Query("SELECT COUNT(p) > 0 FROM Payment p WHERE p.booking.id = :bookingId AND p.isDeleted = false")
    boolean existsByBookingId(@Param("bookingId") Integer bookingId);

    // ✅ SỬA: Tìm tất cả payment records cho booking
    List<Payment> findByBookingIdAndIsDeleted(Integer bookingId, Boolean isDeleted);
    
    // ✅ THÊM: Tìm payment theo type
    Optional<Payment> findByBookingIdAndPaymentTypeAndIsDeleted(Integer bookingId, String paymentType, Boolean isDeleted);
    
    // ✅ THÊM: Check có payment type không
    boolean existsByBookingIdAndPaymentTypeAndIsDeleted(Integer bookingId, String paymentType, Boolean isDeleted);
}