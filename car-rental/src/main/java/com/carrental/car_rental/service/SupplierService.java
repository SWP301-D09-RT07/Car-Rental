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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
    private final CarBrandRepository carBrandRepository;
    private final RegionRepository regionRepository;
    private final FuelTypeRepository fuelTypeRepository;
    private static final Logger logger = LoggerFactory.getLogger(SupplierService.class);

    public SupplierService(CarRepository carRepository,
                          BookingRepository bookingRepository,
                          UserRepository userRepository,
                          ImageService imageService,
                          BookingMapper bookingMapper,
                          StatusRepository statusRepository,
                          CarMapper carMapper,
                          CarBrandRepository carBrandRepository,
                          RegionRepository regionRepository,
                          FuelTypeRepository fuelTypeRepository) {
        this.carRepository = carRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.imageService = imageService;
        this.bookingMapper = bookingMapper;
        this.statusRepository = statusRepository;
        this.carMapper = carMapper;
        this.carBrandRepository = carBrandRepository;
        this.regionRepository = regionRepository;
        this.fuelTypeRepository = fuelTypeRepository;
    }

    private User getCurrentSupplier() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
    }

    @Transactional
    public ResponseEntity<?> addCar(String carDataJson, List<MultipartFile> images) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            VehicleDTO vehicleDTO = objectMapper.readValue(carDataJson, VehicleDTO.class);
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
            Status pendingStatus = statusRepository.findByStatusName("pending").orElse(null);
            if (pendingStatus == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy trạng thái pending");
            }
            car.setStatus(pendingStatus);
            // Mapping brand
            CarBrand brand = carBrandRepository.findAll().stream()
                .filter(b -> b.getBrandName().equalsIgnoreCase(vehicleDTO.getBrand()))
                .findFirst()
                .orElse(null);
            if (brand == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy hãng xe: " + vehicleDTO.getBrand());
            }
            car.setBrand(brand);
            // Mapping region
            Region region = regionRepository.findAll().stream()
                .filter(r -> r.getRegionName().equalsIgnoreCase(vehicleDTO.getRegion()))
                .findFirst()
                .orElse(null);
            if (region == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy khu vực: " + vehicleDTO.getRegion());
            }
            car.setRegion(region);
            // Mapping fuelType
            FuelType fuelType = fuelTypeRepository.findAll().stream()
                .filter(f -> f.getFuelTypeName().equalsIgnoreCase(vehicleDTO.getFuelType()))
                .findFirst()
                .orElse(null);
            if (fuelType == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy loại nhiên liệu: " + vehicleDTO.getFuelType());
            }
            car.setFuelType(fuelType);
            // Transmission
            car.setTransmission(vehicleDTO.getTransmission());
            // Num of seats
            car.setNumOfSeats(vehicleDTO.getNumOfSeats() != null ? vehicleDTO.getNumOfSeats().shortValue() : (short)4);
            if (vehicleDTO.getYear() != null) {
                car.setYear(vehicleDTO.getYear().shortValue());
            }
            car.setColor(vehicleDTO.getColor());
            Car savedCar = carRepository.save(car);
            if (images != null) {
                for (MultipartFile file : images) {
                    Image image = new Image();
                    image.setCar(savedCar);
                    imageService.saveImage(image, file);
                }
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Đăng xe thành công!"));
        } catch (Exception e) {
            System.err.println("[DEBUG] carDataJson: " + carDataJson);
            e.printStackTrace(); // log ra console
            logger.error("Lỗi khi đăng xe:", e);
            return ResponseEntity.status(500).body("Lỗi hệ thống: " + e.getMessage());
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
            summary.put("availableVehicles", carRepository.countBySupplierAndStatusAndIsDeletedFalse(supplier, "available"));
            summary.put("rentedVehicles", carRepository.countBySupplierAndStatusAndIsDeletedFalse(supplier, "rented"));
            summary.put("pendingApprovalVehicles", carRepository.countBySupplierAndStatusAndIsDeletedFalse(supplier, "pending_approval"));
            summary.put("totalBookings", bookingRepository.countByCar_Supplier(supplier));
            summary.put("pendingBookings", bookingRepository.countByCar_SupplierAndStatus_StatusName(supplier, "pending"));
            summary.put("activeBookings", bookingRepository.countByCar_SupplierAndStatus_StatusName(supplier, "in progress"));
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