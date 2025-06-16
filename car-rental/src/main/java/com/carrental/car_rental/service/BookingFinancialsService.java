package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.dto.PriceBreakdownDTO;
import com.carrental.car_rental.entity.BookingFinancial;
import com.carrental.car_rental.entity.Car;
import com.carrental.car_rental.entity.Promotion;
import com.carrental.car_rental.mapper.BookingFinancialsMapper;
import com.carrental.car_rental.repository.BookingFinancialsRepository;
import com.carrental.car_rental.repository.CarRepository;
import com.carrental.car_rental.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingFinancialsService {
    private static final Logger logger = LoggerFactory.getLogger(BookingFinancialsService.class);
    private final BookingFinancialsRepository repository;
    private final BookingFinancialsMapper mapper;
    private final CarRepository carRepository;
    private final PromotionRepository promotionRepository;

    private static final BigDecimal DRIVER_FEE_PER_DAY = new BigDecimal("300000.00"); // VND
    private static final BigDecimal OVERTIME_FEE_PER_HOUR = new BigDecimal("50000.00"); // VND
    private static final BigDecimal DELIVERY_FEE = new BigDecimal("100000.00"); // VND

    public BookingFinancialsDTO findById(Integer id) {
        BookingFinancial entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BookingFinancials not found with id: " + id));
        return mapper.toDTO(entity);
    }

    public List<BookingFinancialsDTO> findAll() {
        return repository.findAll().stream()
                .filter(e -> !e.getIsDeleted())
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<BookingFinancialsDTO> findByBookingId(Integer bookingId) {
        return repository.findByBookingIdAndIsDeletedFalse(bookingId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public BookingFinancialsDTO save(BookingFinancialsDTO dto) {
        BookingFinancial entity = mapper.toEntity(dto);
        entity.setIsDeleted(false);
        return mapper.toDTO(repository.save(entity));
    }

    public BookingFinancialsDTO calculateFinancials(BookingDTO booking) {
        logger.info("Calculating financials for booking ID: {}", booking.getBookingId());
        Car car = carRepository.findById(booking.getCarId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));

        // Validate dates
        if (booking.getPickupDateTime() == null || booking.getDropoffDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup or dropoff date is missing");
        }
        if (booking.getPickupDateTime().isAfter(booking.getDropoffDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup date cannot be after dropoff date");
        }

        long days = ChronoUnit.DAYS.between(
                booking.getPickupDateTime(),
                booking.getDropoffDate()
        );
        if (days < 1) days = 1;

        // Validate daily rate
        BigDecimal dailyRate = car.getDailyRate();
        if (dailyRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid daily rate for car ID: " + booking.getCarId());
        }

        BigDecimal basePrice = dailyRate.multiply(BigDecimal.valueOf(days));
        BigDecimal extraFees = calculateExtraFees(booking, days);
        BigDecimal totalFare = basePrice.add(extraFees);
        BigDecimal tax = basePrice.multiply(new BigDecimal("0.10")); // 10% VAT
        BigDecimal discount = BigDecimal.ZERO;

        if (booking.getPromoId() != null) {
            Promotion promo = promotionRepository.findById(booking.getPromoId())
                    .filter(p -> !p.getIsDeleted() && p.getEndDate().isAfter(LocalDate.now()))
                    .orElse(null);
            if (promo != null) {
                BigDecimal discountRate = promo.getDiscountPercentage().divide(new BigDecimal("100"), 4, BigDecimal.ROUND_HALF_UP);
                discount = basePrice.multiply(discountRate);
                discount = discount.min(basePrice); // Ensure discount doesn't exceed base price
            }
        }

        BigDecimal finalAmount = totalFare.add(tax).subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Total price cannot be negative");
        }

        BookingFinancialsDTO financials = new BookingFinancialsDTO();
        financials.setBookingId(booking.getBookingId());
        financials.setTotalFare(totalFare.setScale(2, BigDecimal.ROUND_HALF_UP));
        financials.setAppliedDiscount(discount.setScale(2, BigDecimal.ROUND_HALF_UP));
        return save(financials);
    }

    public PriceBreakdownDTO calculatePriceBreakdown(BookingDTO booking) {
        logger.info("Calculating price breakdown for booking ID: {}", booking.getBookingId());
        Car car = carRepository.findById(booking.getCarId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));

        // Validate dates
        if (booking.getPickupDateTime() == null || booking.getDropoffDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup or dropoff date is missing");
        }
        if (booking.getPickupDateTime().isAfter(booking.getDropoffDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup date cannot be after dropoff date");
        }

        long days = ChronoUnit.DAYS.between(
                booking.getPickupDateTime(),
                booking.getDropoffDate()
        );
        if (days < 1) days = 1;

        // Validate daily rate
        BigDecimal dailyRate = car.getDailyRate();
        if (dailyRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid daily rate for car ID: " + booking.getCarId());
        }

        BigDecimal basePrice = dailyRate.multiply(BigDecimal.valueOf(days));
        BigDecimal extraFees = calculateExtraFees(booking, days);
        BigDecimal totalFare = basePrice.add(extraFees);
        BigDecimal tax = basePrice.multiply(new BigDecimal("0.10")); // 10% VAT
        BigDecimal discount = BigDecimal.ZERO;

        if (booking.getPromoId() != null) {
            Promotion promo = promotionRepository.findById(booking.getPromoId())
                    .filter(p -> !p.getIsDeleted() && p.getEndDate().isAfter(LocalDate.now()))
                    .orElse(null);
            if (promo != null) {
                BigDecimal discountRate = promo.getDiscountPercentage().divide(new BigDecimal("100"), 4, BigDecimal.ROUND_HALF_UP);
                discount = basePrice.multiply(discountRate);
                discount = discount.min(basePrice); // Ensure discount doesn't exceed base price
            }
        }

        BigDecimal total = totalFare.add(tax).subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Total price cannot be negative");
        }

        BigDecimal deposit = total.multiply(new BigDecimal("0.30")).setScale(2, BigDecimal.ROUND_HALF_UP);

        PriceBreakdownDTO breakdown = new PriceBreakdownDTO();
        breakdown.setBasePrice(basePrice.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setExtraFee(extraFees.setScale(2, BigDecimal.ROUND_HALF_UP)); // For display only
        breakdown.setTax(tax.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setDiscount(discount.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setTotal(total.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setDeposit(deposit);
        return breakdown;
    }

    private BigDecimal calculateExtraFees(BookingDTO booking, long days) {
        BigDecimal extraFees = BigDecimal.ZERO;

        // Driver fee: 300,000 VND per day if driverId is present
        if (booking.getDriverId() != null || Boolean.TRUE.equals(booking.getWithDriver())) {
            extraFees = extraFees.add(DRIVER_FEE_PER_DAY.multiply(BigDecimal.valueOf(days)));
            logger.info("Added driver fee: {} VND for {} days", DRIVER_FEE_PER_DAY.multiply(BigDecimal.valueOf(days)), days);
        }

        // Delivery fee: 100,000 VND if requested
        if (Boolean.TRUE.equals(booking.getDeliveryRequested())) {
            extraFees = extraFees.add(DELIVERY_FEE);
            logger.info("Added delivery fee: {} VND", DELIVERY_FEE);
        }

        // Overtime fee: 50,000 VND per hour
        if (booking.getEstimatedOvertimeHours() != null && booking.getEstimatedOvertimeHours() > 0) {
            BigDecimal overtimeFee = OVERTIME_FEE_PER_HOUR.multiply(BigDecimal.valueOf(booking.getEstimatedOvertimeHours()));
            extraFees = extraFees.add(overtimeFee);
            logger.info("Added overtime fee: {} VND for {} hours", overtimeFee, booking.getEstimatedOvertimeHours());
        }

        return extraFees.setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    public BookingFinancialsDTO update(Integer id, BookingFinancialsDTO dto) {
        BookingFinancial entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BookingFinancials not found with id: " + id));
        BookingFinancial updatedEntity = mapper.toEntity(dto);
        updatedEntity.setId(id);
        updatedEntity.setIsDeleted(false);
        return mapper.toDTO(repository.save(updatedEntity));
    }

    public void delete(Integer id) {
        BookingFinancial entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BookingFinancials not found with id: " + id));
        entity.setIsDeleted(true);
        repository.save(entity);
    }
}
