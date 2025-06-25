package com.carrental.car_rental.controller;

import com.carrental.car_rental.config.JwtTokenProvider;
import com.carrental.car_rental.dto.CreateUserDTO;
import com.carrental.car_rental.dto.UpdateUserDTO;
import com.carrental.car_rental.dto.UserDTO;
import com.carrental.car_rental.dto.ToggleUserStatusRequest;
import com.carrental.car_rental.service.UserService;
import com.carrental.car_rental.service.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final BookingService bookingService;

    @Autowired
    public UserController(UserService userService, JwtTokenProvider jwtTokenProvider, BookingService bookingService) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.bookingService = bookingService;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('admin') or (hasRole('customer') and @securityService.canAccessUser(authentication, #id))")
    public ResponseEntity<?> getUser(@PathVariable Integer id, Authentication authentication) {
        logger.info("Yêu cầu lấy thông tin người dùng ID: {} từ IP: {}", id, getClientIp(authentication));
        try {
            UserDTO userDTO = userService.findById(id);
            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy thông tin người dùng ID: {} - {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Không tìm thấy người dùng với ID: " + id));
        }
    }

    // Lấy danh sách tất cả người dùng (của hoàng)
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        logger.info("Yêu cầu lấy danh sách tất cả người dùng từ IP: {}", getClientIp(authentication));
        try {
            List<UserDTO> users = userService.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách người dùng: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy danh sách người dùng: " + e.getMessage()));
        }
    }

    // Lấy người dùng theo role ID (của hoàng)
    @GetMapping("/role/{roleId}")
    public ResponseEntity<?> getUsersByRoleId(@PathVariable Integer roleId, Authentication authentication) {
        logger.info("Yêu cầu lấy người dùng theo roleId: {} từ IP: {}", roleId, getClientIp(authentication));
        try {
            List<UserDTO> users = userService.findByRoleId(roleId);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy người dùng theo roleId: {} - {}", roleId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy người dùng theo roleId: " + e.getMessage()));
        }
    }

    // Lấy người dùng theo country code (của hoàng)
    @GetMapping("/country/{countryCode}")
    public ResponseEntity<?> getUsersByCountryCode(@PathVariable String countryCode, Authentication authentication) {
        logger.info("Yêu cầu lấy người dùng theo countryCode: {} từ IP: {}", countryCode, getClientIp(authentication));
        try {
            List<UserDTO> users = userService.findByCountryCode(countryCode);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy người dùng theo countryCode: {} - {}", countryCode, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy người dùng theo countryCode: " + e.getMessage()));
        }
    }

    // Lấy người dùng theo email (của hoàng)
    @GetMapping("/email")
    public ResponseEntity<?> getUserByEmail(@RequestParam String email, Authentication authentication) {
        logger.info("Yêu cầu lấy thông tin người dùng theo email: {} từ IP: {}", email, getClientIp(authentication));
        try {
            if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                return ResponseEntity.badRequest().body(createErrorResponse("Email không hợp lệ!"));
            }
            Optional<UserDTO> userDTO = userService.findByEmail(email);
            return userDTO.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body((UserDTO) createErrorResponse("Không tìm thấy người dùng với email: " + email)));
        } catch (Exception e) {
            logger.error("Lỗi khi lấy thông tin người dùng theo email: {} - {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
        }
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('customer')")
    public ResponseEntity<?> getCurrentUserProfile(Authentication authentication) {
        logger.info("Yêu cầu lấy thông tin hồ sơ người dùng hiện tại từ IP: {}", getClientIp(authentication));
        try {
            String email = authentication.getName();
            Optional<UserDTO> userDTO = userService.findByEmail(email);
            return userDTO.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body((UserDTO) createErrorResponse("Không tìm thấy thông tin người dùng hiện tại")));
        } catch (Exception e) {
            logger.error("Lỗi khi lấy thông tin hồ sơ người dùng hiện tại: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
        }
    }

    // Tạo người dùng mới (của hoàng)
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserDTO dto, Authentication authentication) {
        logger.info("Yêu cầu tạo người dùng mới với email: {} từ IP: {}", dto.getEmail(), getClientIp(authentication));
        try {
            UserDTO createdUser = userService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (Exception e) {
            logger.error("Lỗi khi tạo người dùng mới với email: {} - {}", dto.getEmail(), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Lỗi khi tạo người dùng: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin') or (hasRole('customer') and @securityService.canAccessUser(authentication, #id))")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @Valid @RequestBody UpdateUserDTO dto, Authentication authentication) {
        logger.info("Yêu cầu cập nhật người dùng ID: {} từ IP: {}", id, getClientIp(authentication));
        try {
            UserDTO updatedUser = userService.update(id, dto);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Lỗi khi cập nhật người dùng ID: {} - {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Lỗi khi cập nhật người dùng: " + e.getMessage()));
        }
    }

    // Xóa người dùng (của hoàng)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id, Authentication authentication) {
        logger.info("Yêu cầu xóa người dùng ID: {} từ IP: {}", id, getClientIp(authentication));
        try {
            userService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Lỗi khi xóa người dùng ID: {} - {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Không tìm thấy người dùng để xóa: " + e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('customer')")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        logger.info("Yêu cầu thay đổi mật khẩu từ IP: {}", getClientIp(authentication));
        try {
            if (!PASSWORD_PATTERN.matcher(request.getNewPassword()).matches()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt"));
            }
            userService.changePassword(authentication.getName(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(createSuccessResponse("Thay đổi mật khẩu thành công."));
        } catch (Exception e) {
            logger.error("Lỗi khi thay đổi mật khẩu: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Lỗi khi thay đổi mật khẩu: " + e.getMessage()));
        }
    }

    private String getClientIp(Authentication authentication) {
        String clientIp = "Unknown";
        if (org.springframework.web.context.request.RequestContextHolder.getRequestAttributes() != null) {
            jakarta.servlet.http.HttpServletRequest request = (jakarta.servlet.http.HttpServletRequest) org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes().resolveReference(org.springframework.web.context.request.RequestAttributes.REFERENCE_REQUEST);
            clientIp = request.getHeader("X-Forwarded-For");
            if (clientIp == null || clientIp.isEmpty()) {
                clientIp = request.getRemoteAddr();
            }
        }
        return clientIp;
    }

    private Map<String, Object> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        return response;
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }

    @Data
    private static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "New password must be at least 8 characters")
        private String newPassword;
    }

    // Lấy danh sách người dùng có phân trang và lọc (của hoàng)
    @GetMapping
    public ResponseEntity<Page<UserDTO>> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        logger.info("Xử lý yêu cầu GET /api/users với params: page={}, size={}, role={}, status={}", page, size, role, status);
        Page<UserDTO> users = userService.findUsersWithFilters(role, status, page, size);
        return ResponseEntity.ok(users);
    }
    // Chuyển đổi trạng thái người dùng (của hoàng)
    @PutMapping("/{userId}/toggle-status")
    public ResponseEntity<UserDTO> toggleUserStatus(
            @PathVariable Integer userId,
            @Valid @RequestBody ToggleUserStatusRequest request) {
        logger.info("=== BẮT ĐẦU CHUYỂN ĐỔI TRẠNG THÁI NGƯỜI DÙNG ===");
        logger.info("User ID: {}", userId);
        logger.info("Request body: reason={}", request.getReason());
        logger.info("Authentication: {}", SecurityContextHolder.getContext().getAuthentication());
        
        try {
            logger.info("Gọi UserService.toggleUserStatus()...");
            UserDTO updatedUser = userService.toggleUserStatus(userId, request);
            logger.info("Chuyển đổi trạng thái thành công! User mới: {}", updatedUser);
            logger.info("=== KẾT THÚC CHUYỂN ĐỔI TRẠNG THÁI NGƯỜI DÙNG (THÀNH CÔNG) ===");
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("=== LỖI KHI CHUYỂN ĐỔI TRẠNG THÁI NGƯỜI DÙNG ===");
            logger.error("User ID: {}", userId);
            logger.error("Request: {}", request);
            logger.error("Exception type: {}", e.getClass().getSimpleName());
            logger.error("Exception message: {}", e.getMessage());
            logger.error("Stack trace:", e);
            logger.error("=== KẾT THÚC LỖI ===");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body((UserDTO) createErrorResponse("Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }

    // Lấy user role customer đăng ký trong tháng/năm (của hoàng)
    @GetMapping("/new-by-month")
    public ResponseEntity<List<UserDTO>> getNewUsersByMonth(@RequestParam int month, @RequestParam int year) {
        List<UserDTO> users = userService.findNewUsersByMonth(month, year);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/recent-userbooking")
    public ResponseEntity<List<UserDTO>> getRecentBookingUsers(@RequestParam(defaultValue = "5") int size) {
        List<UserDTO> users = bookingService.findRecentBookingUsers(size);
        return ResponseEntity.ok(users);
    }
}