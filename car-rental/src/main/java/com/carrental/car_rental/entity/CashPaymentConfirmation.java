package com.carrental.car_rental.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "cash_payment_confirmations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CashPaymentConfirmation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", referencedColumnName = "payment_id")
    @JsonBackReference
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", referencedColumnName = "user_id")
    private User supplier;

    @Column(name = "amount_received", precision = 15, scale = 2)
    private BigDecimal amountReceived;

    @Column(name = "currency", length = 10)
    private String currency = "VND";

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "confirmation_type", length = 20)
    private String confirmationType; // "pickup", "delivery", "return"

    @Column(name = "supplier_confirmation_code", length = 50)
    private String supplierConfirmationCode;

    @Column(name = "is_confirmed")
    private Boolean isConfirmed = false;

    @Column(name = "notes", length = 500)
    private String notes;

    // Platform fee management
    @Column(name = "platform_fee", precision = 15, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "platform_fee_status", length = 20)
    private String platformFeeStatus = "pending"; // "pending", "paid", "overdue"

    @Column(name = "platform_fee_due_date")
    private Instant platformFeeDueDate;

    @Column(name = "platform_fee_paid_at")
    private Instant platformFeePaidAt;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
