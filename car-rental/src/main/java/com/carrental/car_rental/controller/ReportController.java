package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.ReportDTO;
import com.carrental.car_rental.service.ReportService;
import com.carrental.car_rental.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;
    
    @Autowired
    private UserService userService;

    // Lấy báo cáo tổng quan (của hoàng)
    @GetMapping("/overview")
    public ResponseEntity<ReportDTO> getOverviewReport() {
        return ResponseEntity.ok(reportService.getOverviewReport());
    }

    // Lấy thống kê đăng ký người dùng theo tháng
    @GetMapping("/user-registrations")
    public ResponseEntity<List<ReportDTO.MonthlyDataDTO>> getMonthlyUserRegistrations() {
        return ResponseEntity.ok(reportService.getMonthlyUserRegistrations());
    }
    
    // Test endpoint để kiểm tra admin users
    @GetMapping("/test-admin")
    public ResponseEntity<String> testAdmin() {
        long adminCount = userService.countUsersByRole("admin");
        return ResponseEntity.ok("Số lượng admin users: " + adminCount);
    }
}