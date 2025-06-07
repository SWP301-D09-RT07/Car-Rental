package com.carrental.car_rental.controller;

import com.carrental.car_rental.service.AuthService;
import com.carrental.car_rental.dto.*;
import com.carrental.car_rental.service.EmailService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;
    private final EmailService emailService;
    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public AuthController(AuthService authService, EmailService emailService) {
        this.authService = authService;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        logger.info("Xử lý đăng nhập cho username: {}", authRequest.getUsername());
        try {
            AuthResponse authResponse = authService.login(authRequest);
            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            logger.warn("Đăng nhập thất bại: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Tên người dùng hoặc mật khẩu không đúng"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody CreateUserDTO createUserDTO) {
        logger.info("Xử lý đăng ký cho username: {}", createUserDTO.getUsername());
        try {
            UserDTO registeredUser = authService.register(createUserDTO);
            String subject = "Xác nhận đăng ký tài khoản";
            String body = "Chào " + createUserDTO.getUsername() + "!\n\nCảm ơn bạn đã đăng ký tài khoản trên CarRental.\n"
                    + "Email: " + createUserDTO.getEmail() + "\n\nTrân trọng,\nĐội ngũ CarRental";
            emailService.sendEmail(createUserDTO.getEmail(), subject, body);
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } catch (Exception e) {
            logger.warn("Đăng ký thất bại: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        logger.info("Xử lý đăng xuất");
        return ResponseEntity.ok(createSuccessResponse("Đăng xuất thành công. Vui lòng xóa JWT token ở phía client."));
    }

    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@Valid @RequestBody EmailRequest emailRequest) {
        logger.info("Kiểm tra email: {}", emailRequest.getEmail());
        try {
            UserDTO user = authService.findByEmail(emailRequest.getEmail());
            if (user != null) {
                String subject = "Đặt lại mật khẩu";
                String body = "Chào " + user.getUsername() + "!\n\nVui lòng truy cập liên kết sau để đặt lại mật khẩu: "
                        + frontendUrl + "/reset-password?email=" + java.net.URLEncoder.encode(user.getEmail(), java.nio.charset.StandardCharsets.UTF_8)
                        + "\n\nTrân trọng,\nĐội ngũ CarRental";
                emailService.sendEmail(user.getEmail(), subject, body);
                return ResponseEntity.ok(createSuccessResponse("Đã gửi email đặt lại mật khẩu."));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Email không tồn tại!"));
        } catch (Exception e) {
            logger.warn("Kiểm tra email thất bại: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        logger.info("Xử lý đặt lại mật khẩu cho email: {}", request.getEmail());
        try {
            authService.updatePassword(request.getEmail(), request.getNewPassword());
            return ResponseEntity.ok(createSuccessResponse("Đặt lại mật khẩu thành công."));
        } catch (Exception e) {
            logger.error("Lỗi đặt lại mật khẩu: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi đặt lại mật khẩu: " + e.getMessage()));
        }
    }

    @GetMapping("/login")
    public ResponseEntity<?> handleInvalidLogin() {
        logger.warn("Yêu cầu GET đến /api/auth/login không được hỗ trợ");
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(createErrorResponse("Phương thức GET không được hỗ trợ. Vui lòng sử dụng POST hoặc đăng nhập qua Google."));
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
}