package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.*;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.entity.Payment;
import com.carrental.car_rental.repository.*;
import com.carrental.car_rental.mapper.BookingMapper;
import com.carrental.car_rental.mapper.CarMapper;
import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.service.BookingFinancialsService;
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
    private final BookingFinancialsService bookingFinancialsService;
    private final PaymentRepository paymentRepository;

    public SupplierService(CarRepository carRepository,
                          BookingRepository bookingRepository,
                          UserRepository userRepository,
                          ImageService imageService,
                          BookingMapper bookingMapper,
                          StatusRepository statusRepository,
                          CarMapper carMapper,
                          BookingFinancialsService bookingFinancialsService,
                          PaymentRepository paymentRepository) {
        this.carRepository = carRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.imageService = imageService;
        this.bookingMapper = bookingMapper;
        this.statusRepository = statusRepository;
        this.carMapper = carMapper;
        this.bookingFinancialsService = bookingFinancialsService;
        this.paymentRepository = paymentRepository;
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
            Status availableStatus = statusRepository.findByStatusName("available").orElse(null);
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
        if (bookingRepository.existsByCar_IdAndStatus_StatusNameNot(id, "completed")) {
            return ResponseEntity.badRequest().body("Cannot delete car with active bookings");
        }
        car.setIsDeleted(true);
        return ResponseEntity.ok(carRepository.save(car));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getBookings() {
        User supplier = getCurrentSupplier();
        List<Booking> bookings = bookingRepository.findByCar_SupplierWithAllRelations(supplier);
        List<BookingDTO> bookingDTOs = bookings.stream()
                .map(booking -> {
                    BookingDTO dto = bookingMapper.toDTO(booking);
                    try {
                        BookingFinancialsDTO financials = bookingFinancialsService.getOrCreateFinancials(dto);
                        if (financials != null && financials.getTotalFare() != null) {
                            dto.setTotalAmount(financials.getTotalFare());
                        } else {
                            dto.setTotalAmount(java.math.BigDecimal.ZERO);
                        }
                    } catch (Exception e) {
                        dto.setTotalAmount(java.math.BigDecimal.ZERO);
                    }
                    // Đã thanh toán full_payment chưa
                    boolean hasFullPayment = paymentRepository.existsByBookingIdAndPaymentTypeAndIsDeleted(booking.getId(), "full_payment", false);
                    dto.setHasFullPayment(hasFullPayment);
                    // Supplier đã xác nhận nhận đủ tiền chưa (tạm thời: status in progress hoặc completed)
                    dto.setSupplierConfirmedFullPayment(
                        "in progress".equalsIgnoreCase(dto.getStatusName()) ||
                        "completed".equalsIgnoreCase(dto.getStatusName())
                    );
                    // Đã hoàn cọc chưa
                    boolean depositRefunded = paymentRepository.existsByBookingIdAndPaymentTypeAndIsDeleted(booking.getId(), "refund", false);
                    dto.setDepositRefunded(depositRefunded);
                    // Trạng thái hoàn cọc
                    String refundStatus = null;
                    var refundPayment = paymentRepository.findByBookingIdAndPaymentTypeAndIsDeleted(booking.getId(), "refund", false)
                            .orElse(null);
                    if (refundPayment != null && refundPayment.getPaymentStatus() != null) {
                        refundStatus = "paid".equalsIgnoreCase(refundPayment.getPaymentStatus().getStatusName()) ? "completed" : "pending";
                    }
                    dto.setRefundStatus(refundStatus);
                    // Trạng thái payout
                    String payoutStatus = null;
                    var payoutPayment = paymentRepository.findByBookingIdAndPaymentTypeAndIsDeleted(booking.getId(), "payout", false)
                            .orElse(null);
                    if (payoutPayment != null && payoutPayment.getPaymentStatus() != null) {
                        payoutStatus = "paid".equalsIgnoreCase(payoutPayment.getPaymentStatus().getStatusName()) ? "completed" : "pending";
                    }
                    dto.setPayoutStatus(payoutStatus);
                    
                    // ✅ THÊM: Load payment details cho từng booking
                    List<Payment> payments = paymentRepository.findByBookingIdAndIsDeleted(booking.getId(), false);
                    List<PaymentDTO> paymentDetails = payments.stream()
                        .map(payment -> {
                            PaymentDTO pdto = new PaymentDTO();
                            pdto.setPaymentId(payment.getId());
                            pdto.setBookingId(payment.getBooking().getId());
                            pdto.setAmount(payment.getAmount());
                            pdto.setCurrency(payment.getRegion().getCurrency());
                            pdto.setTransactionId(payment.getTransactionId());
                            pdto.setPaymentMethod(payment.getPaymentMethod());
                            pdto.setPaymentType(payment.getPaymentType());
                            if (payment.getPaymentDate() != null) {
                                pdto.setPaymentDate(java.time.LocalDateTime.ofInstant(
                                    payment.getPaymentDate(), 
                                    java.time.ZoneId.systemDefault()
                                ));
                            }
                            if (payment.getPaymentStatus() != null) {
                                pdto.setStatusName(payment.getPaymentStatus().getStatusName());
                            }
                            return pdto;
                        })
                        .sorted(java.util.Comparator.comparing(PaymentDTO::getPaymentDate, 
                            java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                        .collect(Collectors.toList());
                    dto.setPaymentDetails(paymentDetails);
                    
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookingDTOs);
    }

    @Transactional
    public ResponseEntity<?> confirmBooking(Integer id) {
        System.out.println("[CONFIRM_BOOKING] Bắt đầu xác nhận bookingId: " + id);
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Booking not found"));
            System.out.println("[CONFIRM_BOOKING] BookingId: " + id + ", CurrentStatus: " + (booking.getStatus() != null ? booking.getStatus().getStatusName() : "null"));
            System.out.println("[CONFIRM_BOOKING] Supplier của booking: " + (booking.getCar() != null && booking.getCar().getSupplier() != null ? booking.getCar().getSupplier().getUsername() : "null"));
            System.out.println("[CONFIRM_BOOKING] Supplier hiện tại: " + getCurrentSupplier().getUsername());

            if (!booking.getCar().getSupplier().equals(getCurrentSupplier())) {
                System.out.println("[CONFIRM_BOOKING] Không đúng supplier!");
                return ResponseEntity.status(403).body("Not authorized to confirm this booking");
            }
            // So sánh status theo statusName (không phân biệt hoa thường)
            String currentStatusName = booking.getStatus() != null ? booking.getStatus().getStatusName() : null;
            if (!"pending".equalsIgnoreCase(currentStatusName)) {
                System.out.println("[CONFIRM_BOOKING] Booking không ở trạng thái pending!");
                return ResponseEntity.badRequest().body("Booking is not in pending status");
            }
            Status confirmedStatus = statusRepository.findByStatusNameIgnoreCase("confirmed");
            booking.setStatus(confirmedStatus);
            bookingRepository.save(booking);
            System.out.println("[CONFIRM_BOOKING] Đã xác nhận thành công bookingId: " + id);
            return ResponseEntity.ok("Booking confirmed successfully");
        } catch (Exception e) {
            System.out.println("[CONFIRM_BOOKING] Lỗi xác nhận bookingId: " + id);
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi xác nhận đơn: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<?> rejectBooking(Integer id) {
        System.out.println("[REJECT_BOOKING] Bắt đầu từ chối bookingId: " + id);
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Booking not found"));
            System.out.println("[REJECT_BOOKING] BookingId: " + id + ", CurrentStatus: " + (booking.getStatus() != null ? booking.getStatus().getStatusName() : "null"));
            System.out.println("[REJECT_BOOKING] Supplier của booking: " + (booking.getCar() != null && booking.getCar().getSupplier() != null ? booking.getCar().getSupplier().getUsername() : "null"));
            System.out.println("[REJECT_BOOKING] Supplier hiện tại: " + getCurrentSupplier().getUsername());

            if (!booking.getCar().getSupplier().equals(getCurrentSupplier())) {
                System.out.println("[REJECT_BOOKING] Không đúng supplier!");
                return ResponseEntity.status(403).body("Not authorized to reject this booking");
            }
            // So sánh status theo statusName (không phân biệt hoa thường)
            String currentStatusName = booking.getStatus() != null ? booking.getStatus().getStatusName() : null;
            if (!"pending".equalsIgnoreCase(currentStatusName)) {
                System.out.println("[REJECT_BOOKING] Booking không ở trạng thái pending!");
                return ResponseEntity.badRequest().body("Booking is not in pending status");
            }
            Status cancelledStatus = statusRepository.findByStatusNameIgnoreCase("cancelled");
            if (cancelledStatus == null) {
                System.out.println("[REJECT_BOOKING] Không tìm thấy status CANCELLED!");
                return ResponseEntity.badRequest().body("Status CANCELLED not found");
            }
            booking.setStatus(cancelledStatus);
            bookingRepository.save(booking);
            System.out.println("[REJECT_BOOKING] Đã từ chối thành công bookingId: " + id);
            return ResponseEntity.ok("Booking rejected successfully");
        } catch (Exception e) {
            System.out.println("[REJECT_BOOKING] Lỗi từ chối bookingId: " + id);
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi từ chối đơn: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<?> completeBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));
        if (!booking.getCar().getSupplier().equals(getCurrentSupplier())) {
            return ResponseEntity.status(403).body("Not authorized to complete this booking");
        }
        Status rentingStatus = statusRepository.findByStatusName("in progress").orElse(null);
        if (rentingStatus == null || !booking.getStatus().equals(rentingStatus)) {
            return ResponseEntity.badRequest().body("Booking is not in renting status");
        }
        Status completedStatus = statusRepository.findByStatusName("completed").orElse(null);
        if (completedStatus == null) {
            return ResponseEntity.badRequest().body("Status COMPLETED not found");
        }
        booking.setStatus(completedStatus);
        Status availableStatus = statusRepository.findByStatusName("available").orElse(null);
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

    @Transactional
    public ResponseEntity<?> confirmFullPayment(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        // Kiểm tra quyền sở hữu
        if (!booking.getCar().getSupplier().equals(getCurrentSupplier())) {
            return ResponseEntity.status(403).body("Not authorized");
        }

        // Đã xác nhận trước đó
        if (Boolean.TRUE.equals(booking.getSupplierDeliveryConfirm())) {
            return ResponseEntity.badRequest().body("Đã xác nhận nhận đủ tiền trước đó");
        }

        // Kiểm tra đã có payment full_payment và đã paid chưa
        boolean hasFullPayment = paymentRepository.existsByBookingIdAndPaymentTypeAndIsDeleted(bookingId, "full_payment", false);
        if (!hasFullPayment) {
            return ResponseEntity.badRequest().body("Chưa có thanh toán full_payment");
        }

        // Đánh dấu đã xác nhận
        booking.setSupplierDeliveryConfirm(true);
        bookingRepository.save(booking);

        // (Có thể gửi notification cho customer ở đây)

        return ResponseEntity.ok("Supplier đã xác nhận đã nhận đủ tiền");
    }
} 