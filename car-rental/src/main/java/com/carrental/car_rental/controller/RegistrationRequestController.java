package com.carrental.car_rental.controller;

import com.carrental.car_rental.entity.RegistrationRequest;
import com.carrental.car_rental.service.RegistrationRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.carrental.car_rental.dto.CreateUserDTO;
import com.carrental.car_rental.dto.UserDetailDTO;
import com.carrental.car_rental.service.UserService;
import com.carrental.car_rental.service.EmailService;
import com.carrental.car_rental.repository.RoleRepository;
import com.carrental.car_rental.repository.StatusRepository;

@RestController
@RequestMapping("/api/registration-requests")
public class RegistrationRequestController {
    @Autowired
    private RegistrationRequestService service;
    @Autowired
    private UserService userService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private StatusRepository statusRepository;

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestParam String fullName,
            @RequestParam String idNumber,
            @RequestParam String address,
            @RequestParam String phoneNumber,
            @RequestParam String email,
            @RequestParam MultipartFile carDocuments,
            @RequestParam MultipartFile businessLicense,
            @RequestParam MultipartFile driverLicense
    ) throws IOException {
        // Lưu file
        String carDocPath = saveFile(carDocuments);
        String businessLicensePath = saveFile(businessLicense);
        String driverLicensePath = saveFile(driverLicense);

        RegistrationRequest req = new RegistrationRequest();
        req.setFullName(fullName);
        req.setIdNumber(idNumber);
        req.setAddress(address);
        req.setPhoneNumber(phoneNumber);
        req.setEmail(email);
        req.setCarDocuments(carDocPath);
        req.setBusinessLicense(businessLicensePath);
        req.setDriverLicense(driverLicensePath);
        req.setStatus("pending");

        service.save(req);
        return ResponseEntity.ok("Đã gửi yêu cầu đăng ký, chờ admin duyệt.");
    }

    @GetMapping
    public List<RegistrationRequest> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<RegistrationRequest> req = service.findById(id);
        return req.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        Optional<RegistrationRequest> reqOpt = service.findById(id);
        if (reqOpt.isPresent()) {
            RegistrationRequest req = reqOpt.get();
            req.setStatus("approved");
            service.save(req);

            // Tạo user mới từ thông tin hồ sơ
            String tempPassword = generateTempPassword();
            CreateUserDTO dto = new CreateUserDTO();
            dto.setUsername(req.getEmail());
            dto.setEmail(req.getEmail());
            dto.setPassword(tempPassword);
            dto.setPhone(req.getPhoneNumber());
            // Lấy role supplier
            dto.setRoleId(roleRepository.findByRoleName("supplier").map(r -> r.getId()).orElse(2));
            // Lấy status active
            dto.setStatusId(statusRepository.findByStatusName("active").map(s -> s.getId()).orElse(1));
            dto.setCountryCode("+84");
            dto.setPreferredLanguage(null);
            UserDetailDTO detail = new UserDetailDTO();
            detail.setFullName(req.getFullName());
            detail.setAddress(req.getAddress());
            dto.setUserDetail(detail);
            userService.save(dto);

            // Gửi email thông báo
            String subject = "Tài khoản chủ xe của bạn đã được duyệt";
            String body = "Xin chào " + req.getFullName() + ",\n\n" +
                    "Tài khoản chủ xe của bạn đã được duyệt.\n" +
                    "Thông tin đăng nhập:\n" +
                    "Email: " + req.getEmail() + "\n" +
                    "Mật khẩu tạm thời: " + tempPassword + "\n" +
                    "Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập.\n\n" +
                    "Trân trọng,\nĐội ngũ Car Rental";
            emailService.sendEmail(req.getEmail(), subject, body);

            return ResponseEntity.ok("Đã duyệt yêu cầu và tạo tài khoản user, đã gửi email cho user.");
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        Optional<RegistrationRequest> reqOpt = service.findById(id);
        if (reqOpt.isPresent()) {
            RegistrationRequest req = reqOpt.get();
            req.setStatus("rejected");
            service.save(req);
            return ResponseEntity.ok("Đã từ chối yêu cầu.");
        }
        return ResponseEntity.notFound().build();
    }

    private String saveFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) return null;
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        // Lấy đường dẫn tuyệt đối tới thư mục uploads
        String uploadDir = new File("uploads").getAbsolutePath();
        File dest = new File(uploadDir, filename);
        System.out.println("Saving file to: " + dest.getAbsolutePath());
        dest.getParentFile().mkdirs();
        file.transferTo(dest);
        // Trả về đường dẫn tương đối để lưu vào DB
        return "uploads/" + filename;
    }

    private String generateTempPassword() {
        // Sinh mật khẩu tạm thời: 10 ký tự, có chữ hoa, số, ký tự đặc biệt
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&";
        StringBuilder sb = new StringBuilder();
        java.util.Random rand = new java.util.Random();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(rand.nextInt(chars.length())));
        }
        return sb.toString();
    }
} 