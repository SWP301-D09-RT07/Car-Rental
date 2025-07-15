package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.CashPaymentConfirmationDTO;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashPaymentManagementService {
    
    private static final Logger logger = LoggerFactory.getLogger(CashPaymentManagementService.class);
    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.05"); // 5% platform fee
    private static final int PLATFORM_FEE_DUE_DAYS = 7; // 7 days to pay platform fee
    
    private final CashPaymentConfirmationRepository cashConfirmationRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final StatusRepository statusRepository;
    private final BookingRepository bookingRepository;
    
    /**
     * Supplier xác nhận đã nhận tiền mặt từ customer
     */
    @Transactional
    public CashPaymentConfirmationDTO confirmCashReceived(Integer paymentId, CashPaymentConfirmationDTO confirmationDTO) {
        logger.info("Supplier confirming cash received for payment ID: {}", paymentId);
        
        // Validate payment exists and is cash payment
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        
        if (!"cash".equalsIgnoreCase(payment.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment method is not cash");
        }
        
        // Check if confirmation already exists
        cashConfirmationRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Cash payment already confirmed");
                });
        
        // Get current supplier
        User currentSupplier = getCurrentSupplier();
        
        // Verify supplier owns this booking
        if (!payment.getBooking().getCar().getSupplier().equals(currentSupplier)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to confirm this payment");
        }
        
        // Calculate platform fee
        BigDecimal amountReceived = confirmationDTO.getAmountReceived();
        BigDecimal platformFee = amountReceived.multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
        
        // Create confirmation record
        CashPaymentConfirmation confirmation = new CashPaymentConfirmation();
        confirmation.setPayment(payment);
        confirmation.setSupplier(currentSupplier);
        confirmation.setAmountReceived(amountReceived);
        confirmation.setCurrency(confirmationDTO.getCurrency() != null ? confirmationDTO.getCurrency() : "VND");
        confirmation.setReceivedAt(Instant.now());
        confirmation.setConfirmationType(confirmationDTO.getConfirmationType());
        confirmation.setSupplierConfirmationCode(generateConfirmationCode());
        confirmation.setIsConfirmed(true);
        confirmation.setNotes(confirmationDTO.getNotes());
        confirmation.setPlatformFee(platformFee);
        confirmation.setPlatformFeeStatus("pending");
        confirmation.setPlatformFeeDueDate(Instant.now().plus(PLATFORM_FEE_DUE_DAYS, ChronoUnit.DAYS));
        
        confirmation = cashConfirmationRepository.save(confirmation);
        
        // Update payment status to paid
        Status paidStatus = statusRepository.findByStatusName("paid")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'paid' not found"));
        payment.setPaymentStatus(paidStatus);
        paymentRepository.save(payment);
        
        logger.info("Cash payment confirmed. Payment ID: {}, Amount: {}, Platform fee: {}", 
                   paymentId, amountReceived, platformFee);
        
        return convertToDTO(confirmation);
    }
    
    /**
     * Supplier thanh toán platform fee
     */
    @Transactional
    public void payPlatformFee(Integer confirmationId) {
        logger.info("Processing platform fee payment for confirmation ID: {}", confirmationId);
        
        CashPaymentConfirmation confirmation = cashConfirmationRepository.findById(confirmationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Confirmation not found"));
        
        User currentSupplier = getCurrentSupplier();
        if (!confirmation.getSupplier().equals(currentSupplier)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized");
        }
        
        if ("paid".equals(confirmation.getPlatformFeeStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Platform fee already paid");
        }
        
        confirmation.setPlatformFeeStatus("paid");
        confirmation.setPlatformFeePaidAt(Instant.now());
        cashConfirmationRepository.save(confirmation);
        
        logger.info("Platform fee paid. Confirmation ID: {}, Amount: {}", 
                   confirmationId, confirmation.getPlatformFee());
    }
    
    /**
     * Lấy danh sách cash payments cần confirm của supplier
     */
    public List<CashPaymentConfirmationDTO> getPendingCashPayments(User supplier) {
        // Lấy các payment cash chưa có confirmation
        List<Payment> pendingCashPayments = paymentRepository.findAll().stream()
                .filter(p -> "cash".equalsIgnoreCase(p.getPaymentMethod()))
                .filter(p -> p.getBooking().getCar().getSupplier().equals(supplier))
                .filter(p -> cashConfirmationRepository.findByPaymentIdAndIsDeletedFalse(p.getId()).isEmpty())
                .collect(Collectors.toList());
        
        return pendingCashPayments.stream()
                .map(this::convertPendingPaymentToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy danh sách platform fees chưa thanh toán của supplier
     */
    public List<CashPaymentConfirmationDTO> getPendingPlatformFees(User supplier) {
        List<CashPaymentConfirmation> pendingFees = cashConfirmationRepository
                .findBySupplierAndPlatformFeeStatus(supplier, "pending");
        
        return pendingFees.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy tổng số tiền platform fee chưa thanh toán
     */
    public BigDecimal getTotalPendingPlatformFees(User supplier) {
        BigDecimal total = cashConfirmationRepository.sumPendingPlatformFeesBySupplier(supplier);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    /**
     * Lấy danh sách platform fees quá hạn
     */
    public List<CashPaymentConfirmationDTO> getOverduePlatformFees() {
        List<CashPaymentConfirmation> overdueFees = cashConfirmationRepository.findOverduePlatformFees(Instant.now());
        
        // Update status to overdue
        overdueFees.forEach(fee -> {
            fee.setPlatformFeeStatus("overdue");
            cashConfirmationRepository.save(fee);
        });
        
        return overdueFees.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private User getCurrentSupplier() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        return userRepository.findByUsername(username)
                .filter(user -> "supplier".equals(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only suppliers can confirm cash payments"));
    }
    
    private String generateConfirmationCode() {
        return "CASH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private CashPaymentConfirmationDTO convertToDTO(CashPaymentConfirmation confirmation) {
        CashPaymentConfirmationDTO dto = new CashPaymentConfirmationDTO();
        dto.setPaymentId(confirmation.getPayment().getId());
        dto.setBookingId(confirmation.getPayment().getBooking().getId());
        dto.setAmountReceived(confirmation.getAmountReceived());
        dto.setCurrency(confirmation.getCurrency());
        dto.setReceivedAt(confirmation.getReceivedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
        dto.setNotes(confirmation.getNotes());
        dto.setConfirmationType(confirmation.getConfirmationType());
        dto.setSupplierConfirmationCode(confirmation.getSupplierConfirmationCode());
        dto.setIsConfirmed(confirmation.getIsConfirmed());
        dto.setPlatformFee(confirmation.getPlatformFee());
        dto.setPlatformFeeStatus(confirmation.getPlatformFeeStatus());
        dto.setPlatformFeeDueDate(confirmation.getPlatformFeeDueDate().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
        return dto;
    }
    
    private CashPaymentConfirmationDTO convertPendingPaymentToDTO(Payment payment) {
        CashPaymentConfirmationDTO dto = new CashPaymentConfirmationDTO();
        dto.setPaymentId(payment.getId());
        dto.setBookingId(payment.getBooking().getId());
        dto.setAmountReceived(payment.getAmount());
        dto.setCurrency("VND");
        dto.setIsConfirmed(false);
        dto.setPlatformFee(payment.getAmount().multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP));
        dto.setPlatformFeeStatus("pending");
        return dto;
    }
}
