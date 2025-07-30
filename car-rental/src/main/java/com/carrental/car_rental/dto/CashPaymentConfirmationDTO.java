package com.carrental.car_rental.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class CashPaymentConfirmationDTO {
    private Integer paymentId;
    private Integer bookingId;
    private BigDecimal amountReceived;
    private String currency;
    private LocalDateTime receivedAt;
    private String notes;
    private String confirmationType; // "pickup", "delivery", "return"
    private String supplierConfirmationCode; // Mã xác nhận từ supplier
    private Boolean isConfirmed;
    private BigDecimal platformFee; // Phí phải chuyển cho platform
    private String platformFeeStatus; // "pending", "paid", "overdue"
    private LocalDateTime platformFeeDueDate;
}
