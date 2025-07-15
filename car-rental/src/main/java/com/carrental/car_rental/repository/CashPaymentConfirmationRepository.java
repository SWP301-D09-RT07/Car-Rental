package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.CashPaymentConfirmation;
import com.carrental.car_rental.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CashPaymentConfirmationRepository extends JpaRepository<CashPaymentConfirmation, Integer> {
    
    Optional<CashPaymentConfirmation> findByPaymentIdAndIsDeletedFalse(Integer paymentId);
    
    List<CashPaymentConfirmation> findBySupplierAndIsDeletedFalse(User supplier);
    
    List<CashPaymentConfirmation> findByIsConfirmedAndIsDeletedFalse(Boolean isConfirmed);
    
    @Query("SELECT c FROM CashPaymentConfirmation c WHERE c.supplier = :supplier AND c.platformFeeStatus = :status AND c.isDeleted = false")
    List<CashPaymentConfirmation> findBySupplierAndPlatformFeeStatus(@Param("supplier") User supplier, @Param("status") String status);
    
    @Query("SELECT c FROM CashPaymentConfirmation c WHERE c.platformFeeDueDate <= :dueDate AND c.platformFeeStatus = 'pending' AND c.isDeleted = false")
    List<CashPaymentConfirmation> findOverduePlatformFees(@Param("dueDate") Instant dueDate);
    
    @Query("SELECT SUM(c.platformFee) FROM CashPaymentConfirmation c WHERE c.supplier = :supplier AND c.platformFeeStatus = 'pending' AND c.isDeleted = false")
    BigDecimal sumPendingPlatformFeesBySupplier(@Param("supplier") User supplier);
    
    @Query("SELECT SUM(c.amountReceived) FROM CashPaymentConfirmation c WHERE c.supplier = :supplier AND c.isConfirmed = true AND c.isDeleted = false AND c.receivedAt >= :start AND c.receivedAt <= :end")
    BigDecimal sumConfirmedCashBySupplierAndPeriod(@Param("supplier") User supplier, @Param("start") Instant start, @Param("end") Instant end);
}
