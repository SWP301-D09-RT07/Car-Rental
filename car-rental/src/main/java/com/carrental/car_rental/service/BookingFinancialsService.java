package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.dto.PriceBreakdownDTO;
import com.carrental.car_rental.entity.Booking;
import com.carrental.car_rental.entity.BookingFinancial;
import com.carrental.car_rental.entity.Car;
import com.carrental.car_rental.entity.Promotion;
import com.carrental.car_rental.mapper.BookingFinancialsMapper;
import com.carrental.car_rental.repository.BookingFinancialsRepository;
import com.carrental.car_rental.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookingFinancialsService {
    private static final Logger logger = LoggerFactory.getLogger(BookingFinancialsService.class);
    private final BookingFinancialsRepository repository;
    private final BookingFinancialsMapper mapper;
    private final PromotionRepository promotionRepository;

    public BookingFinancialsDTO calculateFinancials(Booking booking) {
        logger.info("Calculating financials for booking ID: {}", booking.getId());
        Car car = booking.getCar();
        if (booking.getStartDate() == null || booking.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup or dropoff date is missing");
        }
        if (booking.getStartDate().isAfter(booking.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup date cannot be after dropoff date");
        }
        long days = java.time.temporal.ChronoUnit.DAYS.between(
                booking.getStartDate(),
                booking.getEndDate()
        );
        if (days < 1) days = 1;
        BigDecimal dailyRate = car.getDailyRate();
        if (dailyRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid daily rate for car ID: " + car.getId());
        }
        BigDecimal basePrice = dailyRate.multiply(BigDecimal.valueOf(days));
        BigDecimal extraFees = BigDecimal.ZERO; // Có thể bổ sung logic tính extra fee nếu cần
        BigDecimal totalFare = basePrice.add(extraFees);
        BigDecimal tax = basePrice.multiply(new BigDecimal("0.10")); // 10% VAT
        BigDecimal discount = BigDecimal.ZERO;
        if (booking.getPromo() != null) {
            Promotion promo = booking.getPromo();
            BigDecimal discountRate = promo.getDiscountPercentage().divide(new BigDecimal("100"), 4, BigDecimal.ROUND_HALF_UP);
            discount = basePrice.multiply(discountRate);
            discount = discount.min(basePrice);
        }
        BigDecimal finalAmount = totalFare.add(tax).subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Total price cannot be negative");
        }
        BookingFinancialsDTO financials = new BookingFinancialsDTO();
        financials.setBookingId(booking.getId());
        financials.setTotalFare(totalFare.setScale(2, BigDecimal.ROUND_HALF_UP));
        financials.setAppliedDiscount(discount.setScale(2, BigDecimal.ROUND_HALF_UP));
        return save(financials);
    }

    public PriceBreakdownDTO calculatePriceBreakdown(Booking booking) {
        logger.info("Calculating price breakdown for booking ID: {}", booking.getId());
        Car car = booking.getCar();
        if (booking.getStartDate() == null || booking.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup or dropoff date is missing");
        }
        if (booking.getStartDate().isAfter(booking.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup date cannot be after dropoff date");
        }
        long days = java.time.temporal.ChronoUnit.DAYS.between(
                booking.getStartDate(),
                booking.getEndDate()
        );
        if (days < 1) days = 1;
        BigDecimal dailyRate = car.getDailyRate();
        if (dailyRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid daily rate for car ID: " + car.getId());
        }
        BigDecimal basePrice = dailyRate.multiply(BigDecimal.valueOf(days));
        BigDecimal extraFees = BigDecimal.ZERO; // Có thể bổ sung logic tính extra fee nếu cần
        BigDecimal totalFare = basePrice.add(extraFees);
        BigDecimal tax = basePrice.multiply(new BigDecimal("0.10")); // 10% VAT
        BigDecimal discount = BigDecimal.ZERO;
        if (booking.getPromo() != null) {
            Promotion promo = booking.getPromo();
            BigDecimal discountRate = promo.getDiscountPercentage().divide(new BigDecimal("100"), 4, BigDecimal.ROUND_HALF_UP);
            discount = basePrice.multiply(discountRate);
            discount = discount.min(basePrice);
        }
        BigDecimal total = totalFare.add(tax).subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Total price cannot be negative");
        }
        BigDecimal deposit = total.multiply(new BigDecimal("0.30")).setScale(2, BigDecimal.ROUND_HALF_UP);
        PriceBreakdownDTO breakdown = new PriceBreakdownDTO();
        breakdown.setBasePrice(basePrice.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setExtraFee(extraFees.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setTax(tax.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setDiscount(discount.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setTotal(total.setScale(2, BigDecimal.ROUND_HALF_UP));
        breakdown.setDeposit(deposit);
        return breakdown;
    }

    public BookingFinancialsDTO save(BookingFinancialsDTO dto) {
        BookingFinancial entity = mapper.toEntity(dto);
        entity.setIsDeleted(false);
        return mapper.toDTO(repository.save(entity));
    }

    public Optional<BookingFinancialsDTO> findById(Integer id) {
        return repository.findById(id).map(mapper::toDTO);
    }
}
