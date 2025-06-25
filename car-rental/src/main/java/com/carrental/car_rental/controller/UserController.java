package com.carrental.car_rental.controller;

import com.carrental.car_rental.config.JwtTokenProvider;
import com.carrental.car_rental.dto.CreateUserDTO;
import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.dto.UpdateProfileDTO;
import com.carrental.car_rental.dto.UpdateUserDTO;
import com.carrental.car_rental.dto.UserDTO;
import com.carrental.car_rental.dto.UserDetailDTO;
import com.carrental.car_rental.entity.User;
import com.carrental.car_rental.repository.UserRepository;
import com.carrental.car_rental.service.UserService;
import com.carrental.car_rental.service.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

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
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#+\\-_])[A-Za-z\\d@$!%*?&#+\\-_]{8,}$");    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final BookingService bookingService;

    @Autowired
    public UserController(UserService userService, JwtTokenProvider jwtTokenProvider, UserRepository userRepository, BookingService bookingService) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.bookingService = bookingService;
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getCurrentUserProfile(Authentication authentication) {
        logger.info("=== DEBUG PROFILE REQUEST ===");
        logger.info("Authentication: {}", authentication);
        logger.info("Authentication.getName(): {}", authentication != null ? authentication.getName() : "null");
        logger.info("Authentication.getAuthorities(): {}", authentication != null ? authentication.getAuthorities() : "null");
        logger.info("Authentication.isAuthenticated(): {}", authentication != null ? authentication.isAuthenticated() : "null");
        logger.info("=== END DEBUG ===");
        
        logger.info("Yêu cầu lấy thông tin hồ sơ người dùng hiện tại từ IP: {}", getClientIp(authentication));
        try {
            if (authentication == null) {
                logger.error("Authentication is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Không có thông tin xác thực"));
            }
            
            String username = authentication.getName();
            logger.info("Looking up user by username: {}", username);
            Optional<UserDTO> userDTO = userService.findByUsername(username); // Changed from findByEmail to findByUsername
            return userDTO.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body((UserDTO) createErrorResponse("Không tìm thấy thông tin người dùng hiện tại")));
        } catch (Exception e) {
            logger.error("Lỗi khi lấy thông tin hồ sơ người dùng hiện tại: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
        }
    }
    
//    @PostMapping("/send-email-verification")
//    @PreAuthorize("hasRole('CUSTOMER')")
//    public ResponseEntity<?> sendEmailVerification(Authentication authentication) {
//    try {
//        String username = authentication.getName();
//        userService.sendEmailVerification(username);
//
//        return ResponseEntity.ok(Map.of("success", true, "message", "Email xác thực đã được gửi"));
//    } catch (Exception e) {
//        logger.error("Error sending email verification", e);
//        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//            .body(Map.of("success", false, "error", "Lỗi khi gửi email xác thực"));
//    }
//}

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        logger.info("Yêu cầu thay đổi mật khẩu từ user: {}", authentication != null ? authentication.getName() : "unknown");
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Không có thông tin xác thực"));
            }
            
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Mật khẩu hiện tại không được để trống"));
            }
            
            if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Mật khẩu mới không được để trống"));
            }
            
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
    }    @PutMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> updateCurrentUserProfile(@Valid @RequestBody UpdateProfileDTO dto, Authentication authentication) {
        logger.info("=== UPDATE PROFILE REQUEST ===");
        logger.info("Request data: {}", dto);
        logger.info("UserDetail: {}", dto.getUserDetail());
        logger.info("Authentication: {}", authentication.getName());
        
        try {
            String username = authentication.getName();
            
            // Lấy user hiện tại để giữ nguyên statusId và roleId
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);
            if (userOpt.isEmpty()) {
                logger.error("User not found: {}", username);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Không tìm thấy người dùng"));
            }
            
            User currentUser = userOpt.get();
            
            // Tạo UpdateUserDTO với đầy đủ thông tin
            UpdateUserDTO updateUserDTO = new UpdateUserDTO();
            updateUserDTO.setUsername(dto.getUsername());
            updateUserDTO.setEmail(dto.getEmail());
            updateUserDTO.setPhone(dto.getPhone());
            updateUserDTO.setCountryCode(dto.getCountryCode());
            updateUserDTO.setPreferredLanguage(dto.getPreferredLanguage());
            
            // Kiểm tra method name trong Role và Status entity
            updateUserDTO.setRoleId(currentUser.getRole().getId()); // hoặc getId()
            updateUserDTO.setStatusId(currentUser.getStatus().getId()); // hoặc getId()
            
            // Sử dụng UserDetail từ request
            if (dto.getUserDetail() != null) {
                updateUserDTO.setUserDetail(dto.getUserDetail()); // Sử dụng trực tiếp object từ request
            }
            
            logger.info("Calling userService.update with userId: {}, updateUserDTO: {}", currentUser.getId(), updateUserDTO);
            
            UserDTO updatedUser = userService.update(currentUser.getId(), updateUserDTO);
            logger.info("Profile updated successfully for user: {}", username);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cập nhật thông tin thành công");
            response.put("data", updatedUser);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating profile for user: {}", authentication.getName(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Lỗi khi cập nhật thông tin: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }



    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('CUSTOMER') and @securityService.canAccessUser(authentication, #id))")
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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/role/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/country/{countryCode}")
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/email")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('CUSTOMER') and @securityService.canAccessEmail(authentication, #email))")
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
    }    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN') or (hasRole('CUSTOMER') and @securityService.canAccessUser(authentication, #id))")
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/profile/bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserBookingHistory(Authentication authentication) {
        logger.info("Getting booking history for user: {}", authentication.getName());
        
        try {
            String username = authentication.getName();
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Không tìm thấy người dùng"));
            }
            
            // Sử dụng BookingService thay vì repository trực tiếp
            List<BookingDTO> bookingHistory = bookingService.findByUserId(userOpt.get().getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", bookingHistory);
            response.put("total", bookingHistory.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting booking history", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Lỗi khi tải lịch sử đặt xe: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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
    }    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message); // Changed from "error" to "message" to match frontend expectations
        response.put("error", message);   // Keep both for compatibility
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
}