package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByBookingIdAndIsDeletedFalse(Integer bookingId);
    Optional<Payment> findByTransactionIdAndIsDeletedFalse(String transactionId);
}