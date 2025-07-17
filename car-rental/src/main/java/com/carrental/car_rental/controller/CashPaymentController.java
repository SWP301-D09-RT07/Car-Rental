package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.CashPaymentConfirmationDTO;
import com.carrental.car_rental.entity.Booking;
import com.carrental.car_rental.entity.Payment;
import com.carrental.car_rental.entity.User;
import com.carrental.car_rental.entity.Status;
import com.carrental.car_rental.entity.CashPaymentConfirmation;
import com.carrental.car_rental.repository.UserRepository;
import com.carrental.car_rental.repository.PaymentRepository;
import com.carrental.car_rental.repository.StatusRepository;
import com.carrental.car_rental.repository.BookingRepository;
import com.carrental.car_rental.repository.CashPaymentConfirmationRepository;
import com.carrental.car_rental.mapper.CashPaymentConfirmationMapper;
import com.carrental.car_rental.service.CashPaymentManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.RoundingMode;

@RestController
@RequestMapping("/api/cash-payments")
@RequiredArgsConstructor
public class CashPaymentController {

    private final CashPaymentManagementService cashPaymentService;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final StatusRepository statusRepository;
    private final BookingRepository bookingRepository;
    private final CashPaymentConfirmationRepository cashPaymentConfirmationRepository;
    private final CashPaymentConfirmationMapper cashPaymentConfirmationMapper;


    private static final Logger logger = LoggerFactory.getLogger(CashPaymentController.class);

    /**
     * Supplier xác nhận đã nhận tiền mặt
     */
    @PostMapping("/{paymentId}/confirm-received")
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

    /**
     * DEBUG: Lấy tất cả payment records của một booking (PUBLIC để debug)
     */
    @GetMapping("/debug/bookings/{bookingId}/payments")
    public ResponseEntity<Map<String, Object>> debugBookingPayments(@PathVariable Integer bookingId) {
        try {
            List<Payment> allPayments = paymentRepository.findByBookingIdAndIsDeletedFalseWithBooking(bookingId);
            
            return ResponseEntity.ok(Map.of(
                "bookingId", bookingId,
                "totalPayments", allPayments.size(),
                "payments", allPayments.stream().map(p -> Map.of(
                    "paymentId", p.getId(),
                    "amount", p.getAmount(),
                    "paymentType", p.getPaymentType(),
                    "paymentMethod", p.getPaymentMethod(),
                    "customerCashConfirmed", p.getCustomerCashConfirmed(),
                    "supplierCashConfirmed", p.getSupplierCashConfirmed(),
                    "paymentStatus", p.getPaymentStatus() != null ? p.getPaymentStatus().getStatusName() : null,
                    "paymentDate", p.getPaymentDate()
                )).toList()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "error", e.getMessage(),
                "bookingId", bookingId
            ));
        }
    }

    /**
     * DEBUG: Lấy tất cả CashPaymentConfirmation records (PUBLIC để debug)
     */
    @GetMapping("/debug/cash-confirmations")
    public ResponseEntity<Map<String, Object>> debugCashConfirmations() {
        try {
            List<CashPaymentConfirmation> allConfirmations = cashPaymentConfirmationRepository.findAll();
            
            return ResponseEntity.ok(Map.of(
                "totalConfirmations", allConfirmations.size(),
                "confirmations", allConfirmations.stream().map(c -> Map.of(
                    "id", c.getId(),
                    "paymentId", c.getPayment() != null ? c.getPayment().getId() : null,
                    "supplierId", c.getSupplier() != null ? c.getSupplier().getId() : null,
                    "amountReceived", c.getAmountReceived(),
                    "isConfirmed", c.getIsConfirmed(),
                    "confirmationType", c.getConfirmationType(),
                    "platformFee", c.getPlatformFee(),
                    "platformFeeStatus", c.getPlatformFeeStatus(),
                    "createdAt", c.getCreatedAt()
                )).toList()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    /**
 * Customer xác nhận đã thanh toán tiền mặt cho pickup
 */
@PostMapping("/bookings/{bookingId}/customer-confirm-cash-pickup")
public ResponseEntity<Map<String, Object>> customerConfirmCashPickup(
        @PathVariable Integer bookingId,
        @RequestBody Map<String, Object> confirmationData) {

    try {
        User currentCustomer = getCurrentCustomer();

        // Tìm booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        // Kiểm tra customer có quyền không
        if (!booking.getCustomer().getId().equals(currentCustomer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized");
        }

        // ✅ SỬA: Tìm existing full_payment record trước
        Payment existingFullPayment = paymentRepository.findByBookingIdAndPaymentMethodAndType(bookingId, "cash", "full_payment")
                .orElse(null);

        // Nếu đã có full_payment record, kiểm tra đã confirm chưa
        if (existingFullPayment != null) {
            if (Boolean.TRUE.equals(existingFullPayment.getCustomerCashConfirmed())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer already confirmed payment");
            }
            // Cập nhật existing payment thay vì tạo mới
            existingFullPayment.setCustomerCashConfirmed(true);
            existingFullPayment.setCustomerCashConfirmedAt(Instant.now());
            paymentRepository.save(existingFullPayment);

            // Cập nhật deposit payment nếu có
            Payment cashDeposit = paymentRepository.findByBookingIdAndPaymentMethodAndType(bookingId, "cash", "deposit")
                    .orElse(null);
            if (cashDeposit != null) {
                cashDeposit.setCustomerCashConfirmed(true);
                cashDeposit.setCustomerCashConfirmedAt(Instant.now());
                paymentRepository.save(cashDeposit);
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Customer cash pickup confirmation successful (updated existing payment)",
                "bookingId", bookingId,
                "paymentId", existingFullPayment.getId(),
                "amount", existingFullPayment.getAmount(),
                "confirmedAt", Instant.now()
            ));
        }

        // Nếu chưa có full_payment, tìm cash deposit payment để tạo mới
        Payment cashDeposit = paymentRepository.findByBookingIdAndPaymentMethodAndType(bookingId, "cash", "deposit")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cash deposit payment not found"));

        // Kiểm tra customer chưa confirm deposit
        if (Boolean.TRUE.equals(cashDeposit.getCustomerCashConfirmed())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer already confirmed payment");
        }

        // ✅ LOGIC TẠO MỚI: Chỉ khi chưa có full_payment record
        // Tính totalAmount đơn giản
        BigDecimal depositAmount = booking.getDepositAmount() != null ? booking.getDepositAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount;

        if (depositAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Có deposit: total = deposit / 30%
            totalAmount = depositAmount.divide(new BigDecimal("0.30"), 2, RoundingMode.HALF_UP);
        } else {
            // Cash payment: sử dụng giá trị mặc định hoặc từ BookingFinancial
            totalAmount = new BigDecimal("2000000"); // 2 triệu VND mặc định, bạn có thể điều chỉnh
        }

        BigDecimal collateralAmount = new BigDecimal("5000000"); // 5 triệu VND thế chấp

        // QUAN TRỌNG: Với cash payment, deposit = 0, nên full payment = total + collateral
        BigDecimal fullPaymentAmount;
        if (depositAmount.compareTo(BigDecimal.ZERO) == 0) {
            // Cash payment: full payment = total + collateral
            fullPaymentAmount = totalAmount.add(collateralAmount);
            logger.info("Cash payment calculation: total={}, collateral={}, fullPayment={}",
                       totalAmount, collateralAmount, fullPaymentAmount);
        } else {
            // Có deposit: full payment = total - deposit + collateral
            fullPaymentAmount = totalAmount.subtract(depositAmount).add(collateralAmount);
            logger.info("Payment with deposit: total={}, deposit={}, collateral={}, fullPayment={}",
                       totalAmount, depositAmount, collateralAmount, fullPaymentAmount);
        }

        // Tạo Payment record cho full_payment
        Payment fullPayment = new Payment();
        fullPayment.setBooking(booking);
        fullPayment.setAmount(fullPaymentAmount);
        fullPayment.setPaymentMethod("cash");
        fullPayment.setPaymentType("full_payment");
        fullPayment.setRegion(booking.getCar().getRegion());

        // Set status thành pending
        Status pendingStatus = statusRepository.findByStatusName("pending")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'pending' not found"));
        fullPayment.setPaymentStatus(pendingStatus);

        fullPayment.setPaymentDate(Instant.now());
        fullPayment.setIsDeleted(false);

        // Set customer cash confirmed
        fullPayment.setCustomerCashConfirmed(true);
        fullPayment.setCustomerCashConfirmedAt(Instant.now());
        fullPayment.setSupplierCashConfirmed(false);

        // Save payment
        paymentRepository.save(fullPayment);

        // Cập nhật trạng thái deposit payment
        cashDeposit.setCustomerCashConfirmed(true);
        cashDeposit.setCustomerCashConfirmedAt(Instant.now());
        paymentRepository.save(cashDeposit);

        // ✅ THÊM: Tạo record CashPaymentConfirmation (isConfirmed=false)
        // Chỉ tạo nếu chưa có cho payment này
        boolean exists = cashPaymentConfirmationRepository.findByPaymentIdAndIsDeletedFalse(fullPayment.getId()).isPresent();
        if (!exists) {
            CashPaymentConfirmation confirmation = new CashPaymentConfirmation();
            confirmation.setPayment(fullPayment);
            confirmation.setSupplier(booking.getCar().getSupplier());
            confirmation.setAmountReceived(fullPayment.getAmount());
            confirmation.setCurrency("VND");
            confirmation.setReceivedAt(null); // Chưa xác nhận
            confirmation.setConfirmationType("pickup");
            confirmation.setIsConfirmed(false);
            confirmation.setNotes("Khách hàng xác nhận đã trả tiền mặt, chờ supplier xác nhận");
            // ✅ TÍNH PLATFORM FEE 5% AMOUNT
            java.math.BigDecimal platformFee = fullPayment.getAmount().multiply(new java.math.BigDecimal("0.05")).setScale(2, java.math.RoundingMode.HALF_UP);
            confirmation.setPlatformFee(platformFee); // <-- Đảm bảo không NULL
            confirmation.setPlatformFeeStatus("pending");
            confirmation.setPlatformFeeDueDate(null);
            confirmation.setIsDeleted(false);
            cashPaymentConfirmationRepository.save(confirmation);
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Customer cash pickup confirmation successful",
            "bookingId", bookingId,
            "totalAmount", totalAmount,
            "depositAmount", depositAmount,
            "collateralAmount", collateralAmount,
            "fullPaymentAmount", fullPaymentAmount,
            "confirmedAt", Instant.now(),
            "breakdown", Map.of(
                "totalRental", totalAmount,
                "depositPaid", depositAmount,
                "collateral", collateralAmount,
                "totalToPay", fullPaymentAmount,
                "note", depositAmount.compareTo(BigDecimal.ZERO) == 0 ?
                       "Cash payment: Total rental + Collateral" :
                       "Partial deposit paid: Remaining rental + Collateral"
            )
        ));

    } catch (Exception e) {
        logger.error("Error in customer confirm cash pickup: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("success", false, "error", e.getMessage()));
    }
}
    /**
     * Supplier xác nhận đã nhận tiền mặt từ customer (chuyển booking sang in_progress)
     */
    @PostMapping("/bookings/{bookingId}/supplier-confirm-cash-pickup")
    public ResponseEntity<Map<String, Object>> supplierConfirmCashPickup(
            @PathVariable Integer bookingId,
            @RequestBody Map<String, Object> confirmationData) {

        try {
            User currentSupplier = getCurrentSupplier();

            // ✅ SỬA: Tìm full_payment thay vì deposit
            Payment fullPayment = paymentRepository.findByBookingIdAndPaymentMethodAndType(bookingId, "cash", "full_payment")
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cash full payment not found"));

            // Kiểm tra supplier có quyền không
            if (!fullPayment.getBooking().getCar().getSupplier().equals(currentSupplier)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized");
            }

            // Kiểm tra customer đã confirm chưa
            if (!Boolean.TRUE.equals(fullPayment.getCustomerCashConfirmed())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer must confirm payment first");
            }

            // Kiểm tra supplier chưa confirm
            if (Boolean.TRUE.equals(fullPayment.getSupplierCashConfirmed())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier already confirmed payment");
            }

            // Xác nhận supplier đã nhận tiền
            fullPayment.setSupplierCashConfirmed(true);
            fullPayment.setSupplierCashConfirmedAt(Instant.now());

            // Cập nhật payment status thành paid
            Status paidStatus = statusRepository.findByStatusName("paid")
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'paid' not found"));
            fullPayment.setPaymentStatus(paidStatus);
            paymentRepository.save(fullPayment);

            // ✅ SỬA QUAN TRỌNG: Cập nhật deposit payment status thành paid nếu chưa
            Payment cashDeposit = paymentRepository.findByBookingIdAndPaymentMethodAndType(bookingId, "cash", "deposit")
                    .orElse(null);
            if (cashDeposit != null && !"paid".equals(cashDeposit.getPaymentStatus().getStatusName())) {
                cashDeposit.setPaymentStatus(paidStatus);
                cashDeposit.setSupplierCashConfirmed(true);
                cashDeposit.setSupplierCashConfirmedAt(Instant.now());
                paymentRepository.save(cashDeposit);
            }

            // Chuyển booking sang in_progress
            Booking booking = fullPayment.getBooking();
            Status inProgressStatus = statusRepository.findByStatusName("in_progress")
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'in_progress' not found"));
            booking.setStatus(inProgressStatus);
            bookingRepository.save(booking);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Supplier cash pickup confirmation successful, booking status updated to in_progress",
                "bookingId", bookingId,
                "fullPaymentId", fullPayment.getId(),
                "newStatus", "in_progress",
                "confirmedAt", Instant.now()
            ));

        } catch (Exception e) {
            logger.error("Error in supplier confirm cash pickup: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", e.getMessage()));
            }
        }

        private User getCurrentCustomer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        logger.info("[getCurrentCustomer] Token username/email: {}", username);
        return userRepository.findByUsernameOrEmail(username, username)
                .filter(user -> {
                    String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
                    logger.info("[getCurrentCustomer] Found user: username={}, email={}, roleName={}", user.getUsername(), user.getEmail(), roleName);
                    return roleName != null && "customer".equalsIgnoreCase(roleName);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can confirm cash payments"));
    }

    private User getCurrentSupplier() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        logger.info("[getCurrentSupplier] Token username/email: {}", username);
        return userRepository.findByUsernameOrEmail(username, username)
                .filter(user -> {
                    String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
                    logger.info("[getCurrentSupplier] Found user: username={}, email={}, roleName={}", user.getUsername(), user.getEmail(), roleName);
                    return roleName != null && "supplier".equalsIgnoreCase(roleName);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only suppliers can access this endpoint"));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        logger.info("[getCurrentUser] Token username/email: {}", username);
        return userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
