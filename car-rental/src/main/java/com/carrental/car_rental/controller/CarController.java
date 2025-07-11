package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.*;
import com.carrental.car_rental.service.CarService;
import com.carrental.car_rental.entity.FuelType;
import com.carrental.car_rental.entity.Region;
import com.carrental.car_rental.repository.CarRepository;
import jakarta.validation.constraints.Min;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
public class CarController {

    private static final Logger logger = LoggerFactory.getLogger(CarController.class);
    private final CarService service;
    private final CarRepository carRepository;

    public CarController(CarService service, CarRepository carRepository) {
        this.service = service;
        this.carRepository = carRepository;
    }

    @GetMapping("/featured")
    public ResponseEntity<List<CarDTO>> getFeaturedCars(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.info("Yêu cầu lấy danh sách xe nổi bật, trang {}, kích thước {}", page, size);
        try {
            List<CarDTO> featuredCars = service.getFeaturedCars(page, size);
            return ResponseEntity.ok(featuredCars);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy xe nổi bật: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/popular")
    public ResponseEntity<List<CarDTO>> getPopularCars(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.info("Yêu cầu lấy danh sách xe phổ biến, trang {}, kích thước {}", page, size);
        try {
            List<CarDTO> popularCars = service.getPopularCars(page, size);
            return ResponseEntity.ok(popularCars);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy xe phổ biến: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<ImageDTO>> getCarImages(@PathVariable Integer id) {
        logger.info("Gọi API /cars/{}/images để lấy hình ảnh", id);
        try {
            List<ImageDTO> images = service.findImagesByCarId(id);
            return ResponseEntity.ok(images);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy hình ảnh cho xe {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<CarDTO>> searchCars(
            @RequestParam(required = false) String pickupLocation,
            @RequestParam(required = false) String dropoffLocation,
            @RequestParam(required = false) String pickupDate,
            @RequestParam(required = false) String dropoffDate,
            @RequestParam(required = false) String pickupTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.info("Yêu cầu tìm kiếm xe với pickupLocation: {}, dropoffLocation: {}, pickupDate: {}, dropoffDate: {}, pickupTime: {}, trang {}, kích thước {}",
                pickupLocation, dropoffLocation, pickupDate, dropoffDate, pickupTime, page, size);
        try {
            List<CarDTO> cars = service.searchCars(pickupLocation, dropoffLocation, pickupDate, dropoffDate, pickupTime, page, size);
            return ResponseEntity.ok(cars);
        } catch (Exception e) {
            logger.error("Lỗi khi tìm kiếm xe: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CarDetailsResponseDTO> getCar(@PathVariable @Min(1) Integer id) {
        logger.info("Yêu cầu lấy chi tiết xe với ID: {}", id);
        if (id == null) {
            throw new IllegalArgumentException("ID xe không hợp lệ");
        }
        try {
            return ResponseEntity.ok(service.getCarDetailsWithReviews(id));
        } catch (Exception e) {
            logger.error("Lỗi khi lấy chi tiết xe {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/brands")
    public ResponseEntity<String> handleInvalidBrandsRequest() {
        logger.warn("Request không hợp lệ tới /api/cars/brands, chuyển hướng tới /api/cars/car-brands");
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY)
                .header("Location", "/api/cars/car-brands")
                .build();
    }

    @GetMapping("")
    public ResponseEntity<Page<CarDTO>> getAllCars(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) { // Đổi size về 9 cho khớp frontend
        logger.info("Gọi API /cars để lấy tất cả xe, trang {}, kích thước {}", page, size);
        try {
            Page<CarDTO> cars = service.findAll(page, size);
            if (cars.isEmpty()) {
                logger.warn("Không tìm thấy xe nào trong cơ sở dữ liệu");
            }
            logger.info("Tổng số xe: {}, Tổng số trang: {}", cars.getTotalElements(), cars.getTotalPages());
            return ResponseEntity.ok(cars);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách xe: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<CarDTO>> getCarsBySupplierId(@PathVariable Integer supplierId) {
        logger.info("Yêu cầu lấy xe theo nhà cung cấp với ID: {}", supplierId);
        try {
            List<CarDTO> cars = service.findBySupplierId(supplierId);
            return ResponseEntity.ok(cars);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy xe theo supplierId {}: {}", supplierId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/brand/{carBrandId}")
    public ResponseEntity<List<CarDTO>> getCarsByCarBrandId(@PathVariable Integer carBrandId) {
        logger.info("Yêu cầu lấy xe theo thương hiệu với ID: {}", carBrandId);
        try {
            List<CarDTO> cars = service.findByCarBrandId(carBrandId);
            return ResponseEntity.ok(cars);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy xe theo carBrandId {}: {}", carBrandId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("")
    public ResponseEntity<CarDTO> createCar(@RequestBody CarDTO dto) {
        logger.info("Yêu cầu tạo xe mới: {}", dto);
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.save(dto));
        } catch (Exception e) {
            logger.error("Lỗi khi tạo xe: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CarDTO> updateCar(@PathVariable Integer id, @RequestBody CarDTO dto) {
        logger.info("Yêu cầu cập nhật xe với ID: {}", id);
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (Exception e) {
            logger.error("Lỗi khi cập nhật xe {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable Integer id) {
        logger.warn("Yêu cầu xóa xe với ID: {}", id);
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Lỗi khi xóa xe {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/car-brands")
    public ResponseEntity<List<CarBrandDTO>> getCarBrands() {
        logger.info("Yêu cầu lấy danh sách thương hiệu xe");
        try {
            List<CarBrandDTO> carBrands = service.getCarBrands();
            return ResponseEntity.ok(carBrands);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách thương hiệu xe: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/fuel-types")
    public ResponseEntity<List<FuelType>> getFuelTypes() {
        logger.info("Yêu cầu lấy danh sách loại nhiên liệu");
        try {
            List<FuelType> fuelTypes = service.getFuelTypes();
            return ResponseEntity.ok(fuelTypes);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách loại nhiên liệu: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/regions")
    public ResponseEntity<List<Region>> getRegions() {
        logger.info("Yêu cầu lấy danh sách vùng");
        try {
            List<Region> regions = service.getRegions();
            return ResponseEntity.ok(regions);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách vùng: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/regions/country/{countryCode}")
    public ResponseEntity<List<RegionDTO>> getRegionsByCountryCode(@PathVariable String countryCode) {
        logger.info("Yêu cầu lấy danh sách vùng theo mã quốc gia: {}", countryCode);
        try {
            List<RegionDTO> regions = service.getRegionsByCountryCode(countryCode);
            return ResponseEntity.ok(regions);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách vùng theo countryCode {}: {}", countryCode, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/country-codes")
    public ResponseEntity<List<CountryCodeDTO>> getCountryCodes() {
        logger.info("Yêu cầu lấy danh sách mã quốc gia");
        try {
            List<CountryCodeDTO> countryCodes = service.getCountryCodes();
            return ResponseEntity.ok(countryCodes);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách mã quốc gia: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/seat-options")
    public ResponseEntity<List<Short>> getSeatOptions() {
        logger.info("Yêu cầu lấy danh sách số ghế");
        try {
            List<Short> seatOptions = service.getSeatOptions();
            return ResponseEntity.ok(seatOptions);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách số ghế: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/price-ranges")
    public ResponseEntity<List<String>> getPriceRanges() {
        logger.info("Yêu cầu lấy danh sách khoảng giá");
        try {
            List<String> priceRanges = service.getPriceRanges();
            return ResponseEntity.ok(priceRanges);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách khoảng giá: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/years")
    public ResponseEntity<List<Short>> getYears() {
        logger.info("Yêu cầu lấy danh sách năm sản xuất");
        try {
            List<Short> years = service.getYears();
            return ResponseEntity.ok(years);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách năm sản xuất: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{carId}/rentals")
    public ResponseEntity<List<RentalHistoryDTO>> getRentalHistory(@PathVariable Integer carId) {
        logger.info("Yêu cầu lấy lịch sử thuê xe với ID xe: {}", carId);
        try {
            List<RentalHistoryDTO> rentalHistory = service.getRentalHistory(carId);
            return ResponseEntity.ok(rentalHistory);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy lịch sử thuê xe {}: {}", carId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}