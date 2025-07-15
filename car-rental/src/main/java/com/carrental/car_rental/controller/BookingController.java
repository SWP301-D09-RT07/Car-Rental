package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.BookingConfirmationDTO;
import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.dto.PriceBreakdownDTO;
import com.carrental.car_rental.service.BookingService;
import com.carrental.car_rental.service.BookingFinancialsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import com.carrental.car_rental.entity.Booking;
import com.carrental.car_rental.entity.User;
import com.carrental.car_rental.repository.BookingRepository;
import com.carrental.car_rental.repository.UserRepository;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import com.carrental.car_rental.repository.RegionRepository;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    private final BookingFinancialsService financialsService;
     
    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RegionRepository regionRepository;

    public BookingController(BookingService bookingService, BookingFinancialsService financialsService) {
        this.bookingService = bookingService;
        this.financialsService = financialsService;
    }

    @GetMapping
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        logger.info("Request to get all bookings");
        return ResponseEntity.ok(bookingService.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByUserId(@PathVariable Integer userId) {
        logger.info("Request to get bookings for user ID: {}", userId);
        return ResponseEntity.ok(bookingService.findByUserId(userId));
    }

    @GetMapping("/car/{carId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByCarId(@PathVariable Integer carId) {
        logger.info("Request to get bookings for car ID: {}", carId);
        return ResponseEntity.ok(bookingService.findByCarId(carId));
    }

    @GetMapping("/{id}/financials")
    public ResponseEntity<BookingFinancialsDTO> getBookingFinancials(@PathVariable Integer id) {
        logger.info("Request to get financials for booking ID: {}", id);
        BookingDTO booking = bookingService.findById(id);
        return ResponseEntity.ok(financialsService.getOrCreateFinancials(booking));
    }

    @GetMapping("/{id}/price-breakdown")
    public ResponseEntity<?> getPriceBreakdown(@PathVariable Integer id) {
        try {
            BookingFinancialsDTO financials = financialsService.findById(id);
            if (financials == null) {
                logger.error("[DEBUG] No BookingFinancials found for bookingId {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy thông tin tài chính cho booking này");
            }
            // Lấy booking để lấy các thông tin cần thiết
            Booking booking = bookingRepository.findById(id).orElse(null);
            if (booking == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy booking");
            }
            // Tính toán breakdown
            BigDecimal basePrice = financials.getTotalFare() != null ? financials.getTotalFare() : BigDecimal.ZERO;
            BigDecimal extraFee = financials.getLateFeeAmount() != null ? financials.getLateFeeAmount() : BigDecimal.ZERO;
            BigDecimal tax = basePrice.multiply(new BigDecimal("0.10")).setScale(2, BigDecimal.ROUND_HALF_UP); // 10% VAT
            BigDecimal discount = financials.getAppliedDiscount() != null ? financials.getAppliedDiscount() : BigDecimal.ZERO;
            BigDecimal total = basePrice.add(extraFee).add(tax).subtract(discount);
            if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO;
        

            PriceBreakdownDTO breakdown = new PriceBreakdownDTO();
            breakdown.setBasePrice(basePrice);
            breakdown.setExtraFee(extraFee);
            breakdown.setTax(tax);
            breakdown.setDiscount(discount);
            breakdown.setTotal(total);
            return ResponseEntity.ok(breakdown);
        } catch (Exception e) {
            logger.error("[DEBUG] Breakdown error for bookingId {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi không xác định khi lấy thông tin tài chính: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(@Valid @RequestBody BookingDTO dto) {
        logger.info("Request to create a new booking for car ID: {}", dto.getCarId());
        logger.info("Request data: {}", dto);
        
        // Lấy userId từ authentication context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.error("User not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String username = authentication.getName();
        logger.info("Authenticated user: {}", username);
        
        // Lấy userId từ username (cần implement method này trong UserService)
        try {
            Integer userId = bookingService.getUserIdByUsername(username);
            dto.setUserId(userId);
            logger.info("Set userId: {} for username: {}", userId, username);
        } catch (Exception e) {
            logger.error("Error getting userId for username: {}", username, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        
        try {
            logger.info("Calling bookingService.save with DTO: {}", dto);
            BookingDTO savedBooking = bookingService.save(dto);
            logger.info("Booking saved successfully with ID: {}", savedBooking.getBookingId());
            logger.info("Returning response: {}", savedBooking);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
        } catch (Exception e) {
            logger.error("Error saving booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<BookingConfirmationDTO> confirmBooking(@Valid @RequestBody BookingConfirmationDTO dto) {
        logger.info("Request to confirm booking for car ID: {}", dto.getCarId());
        
        // Lấy userId từ authentication context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.error("User not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String username = authentication.getName();
        logger.info("Authenticated user: {}", username);
        
        // Lấy userId từ username
        try {
            Integer userId = bookingService.getUserIdByUsername(username);
            dto.setUserId(userId);
            logger.info("Set userId: {} for username: {}", userId, username);
        } catch (Exception e) {
            logger.error("Error getting userId for username: {}", username, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        
        try {
            BookingConfirmationDTO confirmedBooking = bookingService.confirmBooking(dto);
            logger.info("Booking confirmed with ID: {}", confirmedBooking.getBookingId());
            return ResponseEntity.status(HttpStatus.CREATED).body(confirmedBooking);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid booking data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error confirming booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingDTO> updateBooking(@PathVariable Integer id, @Valid @RequestBody BookingDTO dto) {
        logger.info("Request to update booking with ID: {}", id);
        return ResponseEntity.ok(bookingService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Integer id, Authentication authentication) {
        logger.warn("Request to hard delete booking with ID: {}", id);
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }
        // Chỉ cho phép chủ booking hoặc admin xóa
        String username = authentication != null ? authentication.getName() : null;
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().contains("admin"));
        if (!isAdmin && (username == null || !username.equals(booking.getCustomer().getUsername()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        // Xóa payment liên quan
        bookingService.deleteAllPaymentsForBooking(booking.getId());
        // Gửi email xác nhận
        try {
            String email = booking.getCustomer().getEmail();
            String subject = "Đơn đặt xe đã bị xóa theo yêu cầu";
            String content = "Chào " + booking.getCustomer().getUsername() + ",\n\n" +
                    "Đơn đặt xe #" + booking.getId() + " đã bị xóa khỏi hệ thống theo yêu cầu của bạn.\n" +
                    "Nếu bạn cần hỗ trợ, vui lòng liên hệ RentCar.";
            // Gửi email (giả lập, bạn có thể dùng service thực tế)
            logger.info("[API] Sending email to {}: {}", email, subject);
        } catch (Exception e) {
            logger.warn("[API] Không gửi được email thông báo xóa booking: {}", booking.getId());
        }
        // Log audit
        logger.info("[API] [AUDIT] Booking {} deleted by {} at {} (user request)", booking.getId(), username, java.time.LocalDateTime.now());
        bookingRepository.delete(booking);
        logger.info("Booking {} deleted from database.", id);
        return ResponseEntity.noContent().build();
    }
    
    
    
    // @GetMapping("/debug/role")
    // public ResponseEntity<?> debugRole(Authentication authentication) {
    //     logger.info("Debug role - Authentication: {}", authentication);
    //     if (authentication != null) {
    //         logger.info("Debug role - Name: {}", authentication.getName());
    //         logger.info("Debug role - Authorities: {}", authentication.getAuthorities());
    //         logger.info("Debug role - Principal: {}", authentication.getPrincipal());
            
    //         return ResponseEntity.ok(Map.of(
    //             "name", authentication.getName(),
    //             "authorities", authentication.getAuthorities().toString(),
    //             "principal", authentication.getPrincipal().toString()
    //         ));
    //     }
    //     return ResponseEntity.ok("No authentication");
    // }

    @GetMapping("/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getBookingById(@PathVariable Integer bookingId, Authentication authentication) {
        logger.info("Request to get booking by ID: {}", bookingId);
        logger.info("Authentication object: {}", authentication);
        
        try {
            BookingDTO booking = bookingService.findByIdWithDetails(bookingId);
            
            // Kiểm tra quyền truy cập
            if (authentication != null) {
                String username = authentication.getName();
                Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);
                
                if (userOpt.isPresent() && !booking.getUserId().equals(userOpt.get().getId())) {
                    logger.warn("Access denied - Booking userId: {}, Current userId: {}", booking.getUserId(), userOpt.get().getId());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "error", "Không có quyền truy cập booking này"));
                }
            } else {
                logger.error("Authentication is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Phiên đăng nhập đã hết hạn"));
            }
            
            return ResponseEntity.ok(Map.of("success", true, "data", booking));
            
        } catch (Exception e) {
            logger.error("Error getting booking by ID: {}", bookingId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Không thể tải chi tiết đặt xe: " + e.getMessage()));
        }
    }

    // Nếu cần method cho admin, tạo endpoint khác
    @GetMapping("/admin/details/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBookingDetailsForAdmin(@PathVariable Integer id) {
        try {
            BookingDTO booking = bookingService.findByIdWithDetails(id);
            return ResponseEntity.ok(Map.of("success", true, "data", booking));
        } catch (Exception e) {
            logger.error("Error getting booking details for admin: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Thêm endpoint test đơn giản
    // @GetMapping("/test/{bookingId}")
    // public ResponseEntity<?> testGetBooking(@PathVariable Integer bookingId) {
    //     logger.info("Test request to get booking by ID: {}", bookingId);
        
    //     try {
    //         BookingDTO booking = bookingService.findByIdWithDetails(bookingId);
    //         return ResponseEntity.ok(Map.of("success", true, "data", booking));
    //     } catch (Exception e) {
    //         logger.error("Test error getting booking: {}", bookingId, e);
    //         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
    //             .body(Map.of("success", false, "error", e.getMessage()));
    //     }
    // }

    @PutMapping("/{bookingId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> cancelBooking(@PathVariable Integer bookingId, Authentication authentication) {
        logger.info("Request to cancel booking: {}", bookingId);
        
        try {
            String username = authentication.getName();
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Không tìm thấy người dùng"));
            }
            
            // Get booking and verify ownership
            BookingDTO booking = bookingService.findByIdWithDetails(bookingId);
            if (!booking.getUserId().equals(userOpt.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "error", "Bạn không có quyền hủy booking này"));
            }
            
            // Check if booking can be cancelled
            if (!"confirmed".equals(booking.getStatusName()) && !"pending".equals(booking.getStatusName())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "error", "Không thể hủy booking với trạng thái hiện tại"));
            }
            
            // Cancel the booking
            BookingDTO cancelledBooking = bookingService.cancelBooking(bookingId);
            
            return ResponseEntity.ok(Map.of(
                "success", true, 
                "message", "Hủy đặt xe thành công",
                "data", cancelledBooking
            ));
            
        } catch (Exception e) {
            logger.error("Error cancelling booking: {}", bookingId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Không thể hủy đặt xe: " + e.getMessage()));
        }
    }

    @GetMapping("/by-payment/{transactionId}")
    public ResponseEntity<BookingDTO> getBookingByTransactionId(@PathVariable String transactionId) {
        logger.info("Request to get booking by transaction ID: {}", transactionId);
        try {
            BookingDTO bookingDTO = bookingService.findByTransactionId(transactionId);
            return ResponseEntity.ok(bookingDTO);
        } catch (Exception e) {
            logger.error("Error getting booking by transaction ID: {}", transactionId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/{id}/ensure-financials")
    public ResponseEntity<Void> ensureBookingFinancials(@PathVariable Integer id) {
        logger.info("Request to ensure financials for booking ID: {}", id);
        bookingService.ensureBookingFinancials(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        logger.info("Test connection endpoint called");
        return ResponseEntity.ok("Booking service is working!");
    }

    @PostMapping("/test-auth")
    public ResponseEntity<String> testAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        String username = authentication.getName();
        logger.info("Test auth endpoint called by user: {}", username);
        return ResponseEntity.ok("Authenticated as: " + username);
    }

    @GetMapping("/next-id")
    public ResponseEntity<Map<String, Integer>> getNextBookingId() {
        logger.info("Request to get next booking ID");
        try {
            Integer nextId = bookingService.getNextBookingId();
            return ResponseEntity.ok(Map.of("nextBookingId", nextId));
        } catch (Exception e) {
            logger.error("Error getting next booking ID: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<BookingDTO>> getRecentBookings(@RequestParam(defaultValue = "5") int size) {
        List<BookingDTO> bookings = bookingService.findRecentBookings(size);
        return ResponseEntity.ok(bookings);
    }

    // ✅ THÊM: Customer confirm delivery endpoint
    @PutMapping("/{bookingId}/confirm-delivery")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> customerConfirmDelivery(@PathVariable Integer bookingId, Authentication authentication) {
        try {
            logger.info("🔄 Customer confirming delivery for booking: {}", bookingId);

            String username = authentication.getName();
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "error", "Không tìm thấy thông tin người dùng"
                ));
            }

            User currentUser = userOpt.get();
            BookingDTO result = bookingService.customerConfirmDelivery(bookingId, currentUser.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result,
                    "message", "Xác nhận nhận xe thành công"
            ));

        } catch (Exception e) {
            logger.error("❌ Customer confirm delivery error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // ✅ THÊM: Customer confirm return endpoint
    @PutMapping("/{bookingId}/confirm-return")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> customerConfirmReturn(@PathVariable Integer bookingId, Authentication authentication) {
        try {
            logger.info("🔄 Customer confirming return for booking: {}", bookingId);

            String username = authentication.getName();
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "error", "Không tìm thấy thông tin người dùng"
                ));
            }

            User currentUser = userOpt.get();
            BookingDTO result = bookingService.customerConfirmReturn(bookingId, currentUser.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result,
                    "message", "Xác nhận trả xe thành công"
            ));

        } catch (Exception e) {
            logger.error("❌ Customer confirm return error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
    // ✅ THÊM: Supplier confirm return endpoint
    @PutMapping("/{bookingId}/supplier-confirm-return")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<?> supplierConfirmReturn(@PathVariable Integer bookingId, Authentication authentication) {
        try {
            logger.info("🔄 Supplier confirming return for booking: {}", bookingId);

            String username = authentication.getName();
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "error", "Không tìm thấy thông tin người dùng"
                ));
            }

            User currentUser = userOpt.get();
            BookingDTO result = bookingService.supplierConfirmReturn(bookingId, currentUser.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result,
                    "message", "Xác nhận trả xe thành công - Booking đã hoàn thành"
            ));

        } catch (Exception e) {
            logger.error("❌ Supplier confirm return error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * API: Lấy số tiền payout cho supplier sau khi booking hoàn thành
     * Chỉ cho ADMIN gọi
     */
    @GetMapping("/{id}/payout-amount")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPayoutAmount(@PathVariable Integer id) {
        try {
            BookingDTO booking = bookingService.findByIdWithDetails(id);
            if (booking == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy booking");
            }
            // Chỉ cho phép lấy payout nếu booking đã hoàn thành
            if (!Boolean.TRUE.equals(booking.getSupplierDeliveryConfirm()) ||
                !Boolean.TRUE.equals(booking.getCustomerReceiveConfirm()) ||
                !Boolean.TRUE.equals(booking.getCustomerReturnConfirm()) ||
                !Boolean.TRUE.equals(booking.getSupplierReturnConfirm())) {
                return ResponseEntity.badRequest().body("Booking chưa hoàn thành đủ 4 xác nhận, không thể payout");
            }
            // Lấy financials
            BookingFinancialsDTO financials = financialsService.getOrCreateFinancials(booking);
            if (financials == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy thông tin tài chính cho booking này");
            }
            // Tính payout: totalFare + lateFeeAmount (extraFee)
            java.math.BigDecimal payoutAmount = financials.getTotalFare();
            if (financials.getLateFeeAmount() != null) {
                payoutAmount = payoutAmount.add(financials.getLateFeeAmount());
            }
            // Lấy breakdown
            PriceBreakdownDTO breakdown = financialsService.calculatePriceBreakdown(booking);
            // Lấy currency từ region
            String currency = "VND";
            Integer regionId = null;
            if (booking.getCar() != null) {
                regionId = booking.getCar().getRegionId();
            }
            if (regionId != null) {
                var regionOpt = regionRepository.findById(regionId);
                if (regionOpt.isPresent() && regionOpt.get().getCurrency() != null) {
                    currency = regionOpt.get().getCurrency();
                }
            }
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("bookingId", id);
            result.put("payoutAmount", payoutAmount);
            result.put("currency", currency);
            result.put("priceBreakdown", breakdown);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("[API] Lỗi khi lấy payout amount cho booking {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi khi lấy payout amount: " + e.getMessage());
        }
    }
}
