package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.VehicleDTO;
import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/supplier")
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    // Quản lý xe
    @PostMapping("/cars")
    public ResponseEntity<?> addCar(
        @RequestPart("carData") String carDataJson,
        @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return supplierService.addCar(carDataJson, images);
    }

    @PutMapping("/cars/{id}")
    public ResponseEntity<?> updateCar(@PathVariable Integer id, @Valid @RequestBody VehicleDTO vehicleDTO) {
        return supplierService.updateCar(id, vehicleDTO);
    }

    @DeleteMapping("/cars/{id}")
    public ResponseEntity<?> deleteCar(@PathVariable Integer id) {
        return supplierService.deleteCar(id);
    }

    @GetMapping("/cars")
    public ResponseEntity<?> getSupplierCars() {
        return supplierService.getSupplierCars();
    }

    // Quản lý đơn thuê
    @GetMapping("/bookings")
    public ResponseEntity<?> getBookings() {
        return supplierService.getBookings();
    }

    @PutMapping("/bookings/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Integer id) {
        return supplierService.confirmBooking(id);
    }

    @PutMapping("/bookings/{id}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable Integer id) {
        return supplierService.rejectBooking(id);
    }

    @PutMapping("/bookings/{id}/complete")
    public ResponseEntity<?> completeBooking(@PathVariable Integer id) {
        return supplierService.completeBooking(id);
    }

    @PutMapping("/bookings/{id}/confirm-full-payment")
    public ResponseEntity<?> confirmFullPayment(@PathVariable Integer id) {
        return supplierService.confirmFullPayment(id);
    }

    // Dashboard
    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> getDashboardSummary() {
        return supplierService.getDashboardSummary();
    }

    @GetMapping("/dashboard/recent-bookings")
    public ResponseEntity<?> getRecentBookings() {
        return supplierService.getRecentBookings();
    }

    @GetMapping("/dashboard/monthly-stats")
    public ResponseEntity<?> getMonthlyStats() {
        return supplierService.getMonthlyStats();
    }
} 