package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.CashPaymentConfirmationDTO;
import com.carrental.car_rental.entity.User;
import com.carrental.car_rental.repository.UserRepository;
import com.carrental.car_rental.service.CashPaymentManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cash-payments")
@RequiredArgsConstructor
public class CashPaymentController {
    
    private final CashPaymentManagementService cashPaymentService;
    private final UserRepository userRepository;
    
    /**
     * Supplier xác nhận đã nhận tiền mặt
     */
    @PostMapping("/{paymentId}/confirm")
    public ResponseEntity<CashPaymentConfirmationDTO> confirmCashReceived(
            @PathVariable Integer paymentId,
            @RequestBody CashPaymentConfirmationDTO confirmationDTO) {
        
        CashPaymentConfirmationDTO result = cashPaymentService.confirmCashReceived(paymentId, confirmationDTO);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Supplier thanh toán platform fee
     */
    @PostMapping("/confirmations/{confirmationId}/pay-platform-fee")
    public ResponseEntity<Map<String, String>> payPlatformFee(@PathVariable Integer confirmationId) {
        cashPaymentService.payPlatformFee(confirmationId);
        return ResponseEntity.ok(Map.of("message", "Platform fee payment processed successfully"));
    }
    
    /**
     * Lấy danh sách cash payments cần confirm
     */
    @GetMapping("/pending")
    public ResponseEntity<List<CashPaymentConfirmationDTO>> getPendingCashPayments() {
        User currentSupplier = getCurrentSupplier();
        List<CashPaymentConfirmationDTO> pendingPayments = cashPaymentService.getPendingCashPayments(currentSupplier);
        return ResponseEntity.ok(pendingPayments);
    }
    
    /**
     * Lấy danh sách platform fees chưa thanh toán
     */
    @GetMapping("/platform-fees/pending")
    public ResponseEntity<List<CashPaymentConfirmationDTO>> getPendingPlatformFees() {
        User currentSupplier = getCurrentSupplier();
        List<CashPaymentConfirmationDTO> pendingFees = cashPaymentService.getPendingPlatformFees(currentSupplier);
        return ResponseEntity.ok(pendingFees);
    }
    
    /**
     * Lấy tổng số tiền platform fee chưa thanh toán
     */
    @GetMapping("/platform-fees/pending/total")
    public ResponseEntity<Map<String, Object>> getTotalPendingPlatformFees() {
        User currentSupplier = getCurrentSupplier();
        BigDecimal total = cashPaymentService.getTotalPendingPlatformFees(currentSupplier);
        return ResponseEntity.ok(Map.of(
            "totalAmount", total,
            "currency", "VND",
            "supplier", currentSupplier.getUsername()
        ));
    }
    
    /**
     * Admin: Lấy danh sách platform fees quá hạn
     */
    @GetMapping("/platform-fees/overdue")
    public ResponseEntity<List<CashPaymentConfirmationDTO>> getOverduePlatformFees() {
        // Only admin can access this endpoint
        User currentUser = getCurrentUser();
        if (!"admin".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can access overdue platform fees");
        }
        
        List<CashPaymentConfirmationDTO> overdueFees = cashPaymentService.getOverduePlatformFees();
        return ResponseEntity.ok(overdueFees);
    }
    
    private User getCurrentSupplier() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        return userRepository.findByUsername(username)
                .filter(user -> "supplier".equals(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only suppliers can access this endpoint"));
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
