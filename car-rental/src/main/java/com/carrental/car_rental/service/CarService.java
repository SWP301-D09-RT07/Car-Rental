package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.*;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.mapper.CarMapper;
import com.carrental.car_rental.mapper.ImageMapper;
import com.carrental.car_rental.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarService {

    private static final Logger logger = LoggerFactory.getLogger(CarService.class);
    private final CarRepository repository;
    private final BookingRepository bookingRepository;
    private final CarMapper mapper;
    private final ImageRepository imageRepository;
    private final ImageMapper imageMapper;
    private final CarBrandRepository carBrandRepository;
    private final FuelTypeRepository fuelTypeRepository;
    private final RegionRepository regionRepository;
    private final CountryCodeRepository countryCodeRepository;

    @Transactional(readOnly = true)
    public List<CarDTO> getFeaturedCars(int page, int size) {
        logger.info("Lấy danh sách xe nổi bật (statusId = 11), trang {}, kích thước {}", page, size);
        try {
            Pageable pageable = PageRequest.of(page, size);
            return repository.findFeaturedCars(pageable)
                    .getContent()
                    .stream()
                    .map(car -> {
                        CarDTO dto = mapper.toDTO(car);
                        dto.setImages(getImagesForCar(car.getId()));
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách xe nổi bật: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách xe nổi bật", e);
        }
    }

    @Transactional(readOnly = true)
    public List<CarDTO> getPopularCars(int page, int size) {
        logger.info("Lấy danh sách xe phổ biến, trang {}, kích thước {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        return repository.findPopularCars(pageable)
                .getContent()
                .stream()
                .map(car -> {
                    CarDTO dto = mapper.toDTO(car);
                    dto.setImages(getImagesForCar(car.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CarDTO> searchCars(String pickupLocation, String dropoffLocation, String pickupDate, String dropoffDate, String pickupTime, int page, int size) {
        logger.info("Tìm kiếm xe với pickupLocation: {}, dropoffLocation: {}, pickupDate: {}, dropoffDate: {}, pickupTime: {}, trang {}, kích thước {}",
                pickupLocation, dropoffLocation, pickupDate, dropoffDate, pickupTime, page, size);
        CarSearchRequestDTO request = new CarSearchRequestDTO();
        request.setStartDate(pickupDate != null ? Instant.parse(pickupDate + "T" + (pickupTime != null ? pickupTime + "Z" : "00:00:00Z")) : null);
        request.setEndDate(dropoffDate != null ? Instant.parse(dropoffDate + "T23:59:59Z") : null);
        return searchAvailableCars(request, page, size)
                .stream()
                .filter(car -> pickupLocation == null || car.getRegionId().toString().contains(pickupLocation))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CarDTO> searchAvailableCars(CarSearchRequestDTO request, int page, int size) {
        logger.info("Tìm kiếm xe khả dụng với request: {}, trang {}, kích thước {}", request, page, size);
        Instant startDate = request.getStartDate();
        Instant endDate = request.getEndDate();
        Pageable pageable = PageRequest.of(page, size);

        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày bắt đầu và kết thúc là bắt buộc.");
        }

        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc phải sau ngày bắt đầu.");
        }

        // Lọc xe khả dụng dựa trên lịch booking
        Page<Car> cars = repository.searchCars(pageable);
        return cars.getContent()
                .stream()
                .map(car -> {
                    Car fullCar = repository.findByIdWithRelations(car.getId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Xe không tồn tại: " + car.getId()));
                    CarDTO dto = mapper.toDTO(fullCar);
                    dto.setImages(getImagesForCar(fullCar.getId()));
                    return dto;
                })
                .filter(car -> isCarAvailable(car.getCarId(), startDate, endDate))
                .filter(car -> {
                    boolean matchesCriteria = true;
                    if (request.getBrandId() != null && !Objects.equals(car.getCarBrandId(), request.getBrandId())) {
                        matchesCriteria = false;
                    }
                    if (request.getFuelTypeId() != null && !Objects.equals(car.getFuelTypeId(), request.getFuelTypeId())) {
                        matchesCriteria = false;
                    }
                    if (request.getRegionId() != null && !Objects.equals(car.getRegionId(), request.getRegionId())) {
                        matchesCriteria = false;
                    }
                    return matchesCriteria;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CarDetailsResponseDTO getCarDetailsWithReviews(Integer carId) {
        logger.info("Lấy chi tiết xe với carId: {}", carId);
        Car car = repository.findByIdWithRelations(carId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Xe không tồn tại với id: " + carId));

        CarDetailsResponseDTO dto = new CarDetailsResponseDTO();
        CarDTO carDTO = mapper.toDTO(car);
        dto.setCarId(carDTO.getCarId());
        dto.setSupplierId(carDTO.getSupplierId());
        dto.setSupplierEmail(car.getSupplier().getEmail());
        dto.setCarBrandId(carDTO.getCarBrandId());
        dto.setBrandName(carDTO.getBrandName());
        dto.setModel(carDTO.getModel());
        dto.setYear((int) carDTO.getYear());
        dto.setColor(carDTO.getColor());
        dto.setNumOfSeats(carDTO.getNumOfSeats());
        dto.setRegionId(carDTO.getRegionId());
        dto.setFeatures(carDTO.getFeatures());
        dto.setFuelTypeId(carDTO.getFuelTypeId());
        dto.setFuelTypeName(carDTO.getFuelTypeName());
        dto.setStatusId(carDTO.getStatusId());
        dto.setStatusName(carDTO.getStatusName());
        dto.setLicensePlate(carDTO.getLicensePlate());
        dto.setDailyRate(carDTO.getDailyRate());
        dto.setCreatedAt(carDTO.getCreatedAt());
        dto.setUpdatedAt(carDTO.getUpdatedAt());
        dto.setImages(getImagesForCar(carId));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ImageDTO> findImagesByCarId(Integer carId) {
        logger.info("Lấy hình ảnh cho xe với carId: {}", carId);
        return imageRepository.findByCarIdAndIsDeletedFalse(carId).stream()
                .sorted((img1, img2) -> Boolean.compare(img2.getIsMain(), img1.getIsMain()))
                .map(imageMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CarDTO findById(Integer id) {
        logger.info("Tìm xe với id: {}", id);
        Car car = repository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Xe không tồn tại với id: " + id));
        CarDTO dto = mapper.toDTO(car);
        dto.setImages(getImagesForCar(id));
        return dto;
    }

    @Transactional(readOnly = true)
    public Page<CarDTO> findAll(int page, int size) {
        logger.info("Lấy tất cả xe, trang {}, kích thước {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<Car> cars = repository.findAllWithRelations(pageable);
        logger.info("Số xe trên trang hiện tại: {}", cars.getContent().size());
        logger.info("Danh sách car IDs: {}", cars.getContent().stream().map(Car::getId).collect(Collectors.toList()));
        return cars.map(car -> {
            CarDTO dto = mapper.toDTO(car);
            dto.setImages(getImagesForCar(car.getId()));
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public List<CarDTO> findBySupplierId(Integer supplierId) {
        logger.info("Tìm xe theo supplierId: {}", supplierId);
        return repository.findBySupplierIdAndIsDeletedFalse(supplierId).stream()
                .map(car -> {
                    CarDTO dto = mapper.toDTO(car);
                    dto.setImages(getImagesForCar(car.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CarDTO> findByCarBrandId(Integer carBrandId) {
        logger.info("Tìm xe theo carBrandId: {}", carBrandId);
        return repository.findByBrand_IdAndIsDeletedFalse(carBrandId).stream()
                .map(car -> {
                    CarDTO dto = mapper.toDTO(car);
                    dto.setImages(getImagesForCar(car.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CarBrandDTO> getCarBrands() {
        logger.info("Lấy danh sách thương hiệu xe");
        try {
            return carBrandRepository.findByIsDeletedFalse().stream()
                    .map(carBrand -> {
                        CarBrandDTO dto = new CarBrandDTO();
                        dto.setCarBrandId(carBrand.getId());
                        dto.setBrandName(carBrand.getBrandName());
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách thương hiệu xe: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách thương hiệu xe", e);
        }
    }

    @Transactional(readOnly = true)
    public List<FuelType> getFuelTypes() {
        logger.info("Lấy danh sách loại nhiên liệu");
        try {
            return fuelTypeRepository.findAll().stream()
                    .filter(fuelType -> !fuelType.getIsDeleted())
                    .distinct()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách loại nhiên liệu: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách loại nhiên liệu", e);
        }
    }

    @Transactional(readOnly = true)
    public List<Region> getRegions() {
        logger.info("Lấy danh sách vùng");
        try {
            return regionRepository.findAll().stream()
                    .filter(region -> !region.getIsDeleted())
                    .distinct()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách vùng: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách vùng", e);
        }
    }

    @Transactional(readOnly = true)
    public List<RegionDTO> getRegionsByCountryCode(String countryCode) {
        logger.info("Lấy danh sách vùng theo mã quốc gia: {}", countryCode);
        try {
            CountryCode country = countryCodeRepository.findById(countryCode)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mã quốc gia không tồn tại: " + countryCode));
            return regionRepository.findByCountryCodeAndIsDeletedFalse(country).stream()
                    .map(region -> {
                        RegionDTO dto = new RegionDTO();
                        dto.setRegionId(region.getId());
                        dto.setRegionName(region.getRegionName());
                        dto.setCurrency(region.getCurrency());
                        return dto;
                    })
                    .distinct()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách vùng theo countryCode {}: {}", countryCode, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách vùng theo mã quốc gia", e);
        }
    }

    @Transactional(readOnly = true)
    public List<CountryCodeDTO> getCountryCodes() {
        logger.info("Lấy danh sách mã quốc gia");
        try {
            // Giả định bạn có CountryCodeRepository
            return countryCodeRepository.findAll().stream()
                    .map(countryCode -> new CountryCodeDTO(countryCode.getCountryCode(), countryCode.getCountryName()))
                    .distinct()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách mã quốc gia: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách mã quốc gia", e);
        }
    }

    @Transactional(readOnly = true)
    public List<Short> getSeatOptions() {
        logger.info("Lấy danh sách số ghế");
        try {
            return repository.findAllWithRelations().stream()
                    .filter(car -> !car.getIsDeleted())
                    .map(Car::getNumOfSeats)
                    .distinct()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách số ghế: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách số ghế", e);
        }
    }

    @Transactional(readOnly = true)
    public List<String> getPriceRanges() {
        logger.info("Lấy danh sách khoảng giá");
        try {
            Map<Double, List<Double>> priceGroups = repository.findAllWithRelations().stream()
                    .filter(car -> !car.getIsDeleted())
                    .map(car -> car.getDailyRate().doubleValue())
                    .distinct()
                    .sorted()
                    .collect(Collectors.groupingBy(
                            price -> Math.floor(price / 500) * 500
                    ));

            return priceGroups.keySet().stream()
                    .sorted()
                    .map(key -> String.format("%.0f-%.0f", key, key + 499))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách khoảng giá: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách khoảng giá", e);
        }
    }

    @Transactional(readOnly = true)
    public List<Short> getYears() {
        logger.info("Lấy danh sách năm sản xuất");
        try {
            return repository.findAllWithRelations().stream()
                    .filter(car -> !car.getIsDeleted())
                    .map(Car::getYear)
                    .distinct()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách năm sản xuất: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách năm sản xuất", e);
        }
    }

    @Transactional
    public CarDTO save(CarDTO dto) {
        logger.info("Lưu xe mới: {}", dto);
        Car entity = mapper.toEntity(dto);
        entity.setIsDeleted(false);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        return mapper.toDTO(repository.save(entity));
    }

    @Transactional
    public CarDTO update(Integer id, CarDTO dto) {
        logger.info("Cập nhật xe với id: {}", id);
        Car existingCar = repository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Xe không tìm thấy với id: " + id));
        Car updatedEntity = mapper.toEntity(dto);
        updatedEntity.setId(id);
        updatedEntity.setIsDeleted(false);
        updatedEntity.setCreatedAt(existingCar.getCreatedAt());
        updatedEntity.setUpdatedAt(Instant.now());
        return mapper.toDTO(repository.save(updatedEntity));
    }

    @Transactional
    public void delete(Integer id) {
        logger.info("Xóa xe với id: {}", id);
        Car car = repository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Xe không tìm thấy với id: " + id));
        car.setIsDeleted(true);
        repository.save(car);
    }

    private List<ImageDTO> getImagesForCar(Integer carId) {
        return imageRepository.findByCarIdAndIsDeletedFalse(carId).stream()
                .sorted((img1, img2) -> Boolean.compare(img2.getIsMain(), img1.getIsMain()))
                .map(imageMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RentalHistoryDTO> getRentalHistory(Integer carId) {
        logger.info("Lấy lịch sử thuê xe cho xe với carId: {}", carId);
        try {
            Car car = repository.findByIdWithRelations(carId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Xe không tồn tại với id: " + carId));

            // Lấy tất cả các booking liên quan đến xe này
            List<Booking> bookings = bookingRepository.findByCarId(carId);

            return bookings.stream()
                    .filter(booking -> booking.getStatus() != null && !"CANCELLED".equals(booking.getStatus().getStatusName()))
                    .map(booking -> {
                        RentalHistoryDTO dto = new RentalHistoryDTO();
                        dto.setId(booking.getId());
                        dto.setRenterName(booking.getCustomer() != null ? booking.getCustomer().getUsername() : "N/A");
                        dto.setStartDate(booking.getStartDate().toString());
                        dto.setEndDate(booking.getEndDate().toString());
                        dto.setStatus(booking.getStatus() != null ? booking.getStatus().getStatusName() : "N/A");
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy lịch sử thuê xe cho carId {}: {}", carId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy lịch sử thuê xe", e);
        }
    }

    private boolean isCarAvailable(Integer carId, Instant startDate, Instant endDate) {
        LocalDate startLocalDate = startDate.atZone(ZoneId.of("UTC")).toLocalDate();
        LocalDate endLocalDate = endDate.atZone(ZoneId.of("UTC")).toLocalDate();
        List<Booking> bookings = bookingRepository.findByCarIdAndOverlappingDates(carId, startLocalDate, endLocalDate);
        return bookings.isEmpty();
    }
}