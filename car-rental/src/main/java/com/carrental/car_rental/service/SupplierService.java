package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.*;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.repository.*;
import com.carrental.car_rental.mapper.BookingMapper;
import com.carrental.car_rental.mapper.CarMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    private final CarRepository carRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ImageService imageService;
    private final BookingMapper bookingMapper;
    private final StatusRepository statusRepository;
    private final CarMapper carMapper;

    public SupplierService(CarRepository carRepository,
                          BookingRepository bookingRepository,
                          UserRepository userRepository,
                          ImageService imageService,
                          BookingMapper bookingMapper,
                          StatusRepository statusRepository,
                          CarMapper carMapper) {
        this.carRepository = carRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.imageService = imageService;
        this.bookingMapper = bookingMapper;
        this.statusRepository = statusRepository;
        this.carMapper = carMapper;
    }

    private User getCurrentSupplier() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
    }

    @Transactional
    public ResponseEntity<?> addCar(VehicleDTO vehicleDTO) {
        try {
            User supplier = getCurrentSupplier();
            if (carRepository.findByLicensePlateAndIsDeletedFalse(vehicleDTO.getLicensePlate()).isPresent()) {
                return ResponseEntity.status(409).body("Biển số xe đã tồn tại");
            }
            Car car = new Car();
            car.setModel(vehicleDTO.getName());
            car.setLicensePlate(vehicleDTO.getLicensePlate());
            car.setFeatures(vehicleDTO.getDescription());
            if (vehicleDTO.getRentalPrice() != null)
                car.setDailyRate(java.math.BigDecimal.valueOf(vehicleDTO.getRentalPrice()));
            car.setSupplier(supplier);
            car.setIsDeleted(false);
            Status availableStatus = statusRepository.findByStatusName("AVAILABLE").orElse(null);
            if (availableStatus == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy trạng thái AVAILABLE");
            }
            car.setStatus(availableStatus);
            return ResponseEntity.ok(carRepository.save(car));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error uploading image: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<?> updateCar(Integer id, VehicleDTO vehicleDTO) {
        try {
            Car car = carRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Car not found"));
            if (!car.getSupplier().equals(getCurrentSupplier())) {
                return ResponseEntity.status(403).body("Not authorized to update this car");
            }
            var existedCar = carRepository.findByLicensePlateAndIsDeletedFalse(vehicleDTO.getLicensePlate());
            if (existedCar.isPresent() && !existedCar.get().getId().equals(id)) {
                return ResponseEntity.status(409).body("Biển số xe đã tồn tại");
            }
            car.setModel(vehicleDTO.getName());
            car.setLicensePlate(vehicleDTO.getLicensePlate());
            car.setFeatures(vehicleDTO.getDescription());
            if (vehicleDTO.getRentalPrice() != null)
                car.setDailyRate(java.math.BigDecimal.valueOf(vehicleDTO.getRentalPrice()));
            return ResponseEntity.ok(carRepository.save(car));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error handling image: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<?> deleteCar(Integer id) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Car not found"));
        if (!car.getSupplier().equals(getCurrentSupplier())) {
            return ResponseEntity.status(403).body("Not authorized to delete this car");
        }
        if (bookingRepository.existsByCar_IdAndStatus_StatusNameNot(id, "COMPLETED")) {
            return ResponseEntity.badRequest().body("Cannot delete car with active bookings");
        }
        car.setIsDeleted(true);
        return ResponseEntity.ok(carRepository.save(car));
    }

    public ResponseEntity<?> getBookings() {
        User supplier = getCurrentSupplier();
        List<Booking> bookings = bookingRepository.findByCar_SupplierWithAllRelations(supplier);
        List<BookingDTO> bookingDTOs = bookings.stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookingDTOs);
    }

    @Transactional
    public ResponseEntity<?> confirmBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));
        if (!booking.getCar().getSupplier().equals(getCurrentSupplier())) {
            return ResponseEntity.status(403).body("Not authorized to confirm this booking");
        }
        Status pendingStatus = statusRepository.findByStatusName("PENDING").orElse(null);
        if (pendingStatus == null || !booking.getStatus().equals(pendingStatus)) {
            return ResponseEntity.badRequest().body("Booking is not in pending status");
        }
        Status confirmedStatus = statusRepository.findByStatusName("CONFIRMED").orElse(null);
        if (confirmedStatus == null) {
            return ResponseEntity.badRequest().body("Status CONFIRMED not found");
        }
        booking.setStatus(confirmedStatus);
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @Transactional
    public ResponseEntity<?> rejectBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));
        if (!booking.getCar().getSupplier().equals(getCurrentSupplier())) {
            return ResponseEntity.status(403).body("Not authorized to reject this booking");
        }
        Status pendingStatus = statusRepository.findByStatusName("PENDING").orElse(null);
        if (pendingStatus == null || !booking.getStatus().equals(pendingStatus)) {
            return ResponseEntity.badRequest().body("Booking is not in pending status");
        }
        Status cancelledStatus = statusRepository.findByStatusName("CANCELLED").orElse(null);
        if (cancelledStatus == null) {
            return ResponseEntity.badRequest().body("Status CANCELLED not found");
        }
        booking.setStatus(cancelledStatus);
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @Transactional
    public ResponseEntity<?> completeBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));
        if (!booking.getCar().getSupplier().equals(getCurrentSupplier())) {
            return ResponseEntity.status(403).body("Not authorized to complete this booking");
        }
        Status rentingStatus = statusRepository.findByStatusName("RENTING").orElse(null);
        if (rentingStatus == null || !booking.getStatus().equals(rentingStatus)) {
            return ResponseEntity.badRequest().body("Booking is not in renting status");
        }
        Status completedStatus = statusRepository.findByStatusName("COMPLETED").orElse(null);
        if (completedStatus == null) {
            return ResponseEntity.badRequest().body("Status COMPLETED not found");
        }
        booking.setStatus(completedStatus);
        Status availableStatus = statusRepository.findByStatusName("AVAILABLE").orElse(null);
        if (availableStatus != null) {
            booking.getCar().setStatus(availableStatus);
        }
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    public ResponseEntity<?> getDashboardSummary() {
        String username = null;
        try {
            username = SecurityContextHolder.getContext().getAuthentication().getName();
            System.out.println("[DEBUG] Dashboard summary for user: " + username);
            User supplier = getCurrentSupplier();
            if (supplier == null) {
                System.out.println("[ERROR] Supplier is null for user: " + username);
                return ResponseEntity.status(401).body("Supplier not found or not authenticated");
            }
            System.out.println("[DEBUG] Supplier: " + supplier.getUsername());
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalVehicles", carRepository.countBySupplierAndIsDeletedFalse(supplier));
            summary.put("availableVehicles", carRepository.countBySupplierAndStatusAndIsDeletedFalse(supplier, "AVAILABLE"));
            summary.put("rentedVehicles", carRepository.countBySupplierAndStatusAndIsDeletedFalse(supplier, "RENTED"));
            summary.put("totalBookings", bookingRepository.countByCar_Supplier(supplier));
            summary.put("pendingBookings", bookingRepository.countByCar_SupplierAndStatus_StatusName(supplier, "PENDING"));
            summary.put("activeBookings", bookingRepository.countByCar_SupplierAndStatus_StatusName(supplier, "RENTING"));
            summary.put("totalRevenue", bookingRepository.calculateTotalRevenueBySupplier(supplier));
            java.time.YearMonth currentMonth = java.time.YearMonth.now();
            java.time.LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
            java.time.LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);
            java.time.Instant startOfMonthInstant = startOfMonth.atZone(java.time.ZoneId.systemDefault()).toInstant();
            java.time.Instant endOfMonthInstant = endOfMonth.atZone(java.time.ZoneId.systemDefault()).toInstant();
            summary.put("monthlyRevenue", bookingRepository.calculateMonthlyRevenueBySupplier(supplier, startOfMonthInstant));
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            System.out.println("[ERROR] Exception in getDashboardSummary for user: " + username + ", message: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error in dashboard summary: " + e.getMessage());
        }
    }

    public ResponseEntity<?> getRecentBookings() {
        User supplier = getCurrentSupplier();
        List<Booking> recentBookings = bookingRepository.findByCar_SupplierWithAllRelations(supplier);
        List<BookingDTO> bookingDTOs = recentBookings.stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
                .limit(10)
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookingDTOs);
    }

    public ResponseEntity<?> getMonthlyStats() {
        Map<String, Object> result = new java.util.HashMap<>();
        List<String> months = new java.util.ArrayList<>();
        List<Double> revenueByMonth = new java.util.ArrayList<>();
        List<Integer> bookingsByMonth = new java.util.ArrayList<>();
        result.put("months", months);
        result.put("revenueByMonth", revenueByMonth);
        result.put("bookingsByMonth", bookingsByMonth);
        return ResponseEntity.ok(result);
    }

    public ResponseEntity<?> getSupplierCars() {
        User supplier = getCurrentSupplier();
        List<Car> cars = carRepository.findBySupplierAndIsDeletedFalseWithAllRelations(supplier);
        List<CarDTO> carDTOs = cars.stream().map(carMapper::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(carDTOs);
    }
} 