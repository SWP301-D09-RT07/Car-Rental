package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.entity.Booking;
import com.carrental.car_rental.entity.Car;
import com.carrental.car_rental.entity.Driver;
import com.carrental.car_rental.entity.Status;
import com.carrental.car_rental.entity.Region;
import com.carrental.car_rental.entity.User;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

//<<<<<<< HEAD
//@Mapper(componentModel = "spring")
//@Component
//public class BookingMapper {
//
//    private static final Logger logger = LoggerFactory.getLogger(BookingMapper.class);
//
//    @Transactional(readOnly = true)
//    public BookingDTO toDTO(Booking booking) {
//        if (booking == null) return null;
//
//        BookingDTO dto = new BookingDTO();
//        dto.setBookingId(booking.getId());
//        dto.setUserId(booking.getCustomer() != null ? booking.getCustomer().getId() : null);
//        dto.setStartDate(booking.getStartDate());
//        dto.setEndDate(booking.getEndDate());
//        dto.setPickupLocation(booking.getPickupLocation());
//        dto.setDropoffLocation(booking.getDropoffLocation());
//        dto.setDepositAmount(booking.getDepositAmount());
//
//        // ✅ THÊM CÁC FIELDS MỚI
//        dto.setSeatNumber(booking.getSeatNumber());
//        dto.setExtensionDays(booking.getExtensionDays());
//        dto.setIsDeleted(booking.getIsDeleted());
//
//        // Convert Instant to LocalDateTime safely
//        if (booking.getBookingDate() != null) {
//            dto.setBookingDate(LocalDateTime.ofInstant(booking.getBookingDate(), ZoneId.systemDefault()));
//        }
//        if (booking.getCreatedAt() != null) {
//            dto.setCreatedAt(LocalDateTime.ofInstant(booking.getCreatedAt(), ZoneId.systemDefault()));
//        }
//        // ✅ THÊM UPDATED_AT
//        if (booking.getUpdatedAt() != null) {
//            dto.setUpdatedAt(LocalDateTime.ofInstant(booking.getUpdatedAt(), ZoneId.systemDefault()));
//        }
//
//        // Car info
//        if (booking.getCar() != null) {
//            dto.setCarId(booking.getCar().getId());
//            dto.setCarModel(booking.getCar().getModel());
//            dto.setCarLicensePlate(booking.getCar().getLicensePlate());
//        }
//
//        // Driver info - có thể null cho xe tự lái
//        if (booking.getDriver() != null) {
//            dto.setDriverId(booking.getDriver().getId());
//            dto.setDriverName(booking.getDriver().getDriverName());
//            dto.setIsSelfDrive(false);
//        } else {
//            dto.setDriverId(null);
//            dto.setDriverName(null);
//            dto.setIsSelfDrive(true);
//        }
//
//        // Status info
//        if (booking.getStatus() != null) {
//            dto.setStatusId(booking.getStatus().getId());
//            dto.setStatusName(booking.getStatus().getStatusName());
//        }
//
//        // Region info
//        if (booking.getRegion() != null) {
//            dto.setRegionId(booking.getRegion().getId());
//            dto.setRegionName(booking.getRegion().getRegionName());
//        }
//
//        // ✅ THÊM PROMO INFO
//        if (booking.getPromo() != null) {
//            dto.setPromoId(booking.getPromo().getId());
//            dto.setPromoCode(booking.getPromo().getCode());
//            dto.setPromoDescription(booking.getPromo().getDescription());
//            dto.setDiscountPercentage(booking.getPromo().getDiscountPercentage());
//        } else {
//            dto.setPromoId(null);
//            dto.setPromoCode(null);
//            dto.setPromoDescription(null);
//            dto.setDiscountPercentage(null);
//        }
//
//        // ✅ THÊM EXTENSION STATUS INFO
//        if (booking.getExtensionStatus() != null) {
//            dto.setExtensionStatusId(booking.getExtensionStatus().getId());
//
//        }
//
//        return dto;
//=======
@Mapper(componentModel = "spring", uses = {UserMapper.class, CarMapper.class})
public interface BookingMapper {
    @Mapping(source = "id", target = "bookingId")
    @Mapping(source = "customer.id", target = "userId")
    @Mapping(source = "car.id", target = "carId")
    @Mapping(source = "customer", target = "customer")
    @Mapping(source = "car", target = "car")
    @Mapping(source = "car.licensePlate", target = "carLicensePlate")
    @Mapping(source = "driver.id", target = "driverId")
    @Mapping(source = "region.id", target = "regionId")
    @Mapping(source = "bookingDate", target = "bookingDate", qualifiedByName = "instantToLocalDateTime")
    @Mapping(source = "pickupLocation", target = "pickupLocation")
    @Mapping(source = "dropoffLocation", target = "dropoffLocation")
    @Mapping(source = "seatNumber", target = "seatNumber")
    @Mapping(source = "depositAmount", target = "depositAmount")
    @Mapping(source = "promo.id", target = "promoId")
    @Mapping(source = "extensionDays", target = "extensionDays")
    @Mapping(source = "extensionStatus.id", target = "extensionStatusId")
    @Mapping(source = "status.id", target = "statusId")
    @Mapping(source = "status.statusName", target = "statusName")
    @Mapping(source = "startDate", target = "pickupDateTime", qualifiedByName = "instantToLocalDateTime")
    @Mapping(source = "endDate", target = "dropoffDateTime", qualifiedByName = "instantToLocalDateTime")
    @Mapping(source = "createdAt", target = "createdAt", qualifiedByName = "instantToLocalDateTime")
    @Mapping(source = "updatedAt", target = "updatedAt", qualifiedByName = "instantToLocalDateTime")
    @Mapping(target = "withDriver", source = "withDriver")
    @Mapping(target = "deliveryRequested", constant = "false")
    @Mapping(target = "estimatedOvertimeHours", constant = "0")

    @Mapping(source = "deliveryConfirmTime", target = "deliveryConfirmTime", qualifiedByName = "instantToLocalDateTime")
    @Mapping(source = "returnConfirmTime", target = "returnConfirmTime", qualifiedByName = "instantToLocalDateTime")
    @Mapping(target = "carModel", ignore = true)
    @Mapping(target = "depositRefunded", ignore = true)
    @Mapping(target = "discountPercentage", ignore = true)
    @Mapping(target = "driverName", ignore = true)
    @Mapping(target = "hasDeposit", ignore = true)
    @Mapping(target = "hasFullPayment", ignore = true)
    @Mapping(target = "hasRated", ignore = true)
    @Mapping(target = "isSelfDrive", ignore = true)
    @Mapping(target = "paymentAmount", ignore = true)
    @Mapping(target = "paymentDate", ignore = true)
    @Mapping(target = "paymentStatus", ignore = true)
    @Mapping(target = "paymentType", ignore = true)
    @Mapping(target = "payoutStatus", ignore = true)
    @Mapping(target = "priceBreakdown", ignore = true)
    @Mapping(target = "promoCode", ignore = true)
    @Mapping(target = "promoDescription", ignore = true)
    @Mapping(target = "refundStatus", ignore = true)
    @Mapping(target = "regionName", ignore = true)
    @Mapping(target = "supplierConfirmedFullPayment", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "totalPaidAmount", ignore = true)
    @Mapping(target = "paymentDetails", ignore = true)
    BookingDTO toDTO(Booking entity);

    @Mapping(source = "bookingId", target = "id")
    @Mapping(source = "userId", target = "customer.id")
    @Mapping(source = "carId", target = "car.id")
    @Mapping(source = "driverId", target = "driver.id")
    @Mapping(source = "regionId", target = "region.id")
    @Mapping(source = "bookingDate", target = "bookingDate", qualifiedByName = "localDateTimeToInstant")
    @Mapping(source = "pickupLocation", target = "pickupLocation")
    @Mapping(source = "dropoffLocation", target = "dropoffLocation")
    @Mapping(source = "seatNumber", target = "seatNumber")
    @Mapping(source = "depositAmount", target = "depositAmount")
    @Mapping(source = "promoId", target = "promo.id")
    @Mapping(source = "extensionDays", target = "extensionDays")
    @Mapping(source = "extensionStatusId", target = "extensionStatus.id")
    @Mapping(source = "statusId", target = "status.id")
    @Mapping(source = "pickupDateTime", target = "startDate", qualifiedByName = "localDateTimeToInstant")
    @Mapping(source = "dropoffDateTime", target = "endDate", qualifiedByName = "localDateTimeToInstant")
    @Mapping(source = "createdAt", target = "createdAt", qualifiedByName = "localDateTimeToInstant")
    @Mapping(source = "updatedAt", target = "updatedAt", qualifiedByName = "localDateTimeToInstant")

    @Mapping(source = "deliveryConfirmTime", target = "deliveryConfirmTime", qualifiedByName = "localDateTimeToInstant")
    @Mapping(source = "returnConfirmTime", target = "returnConfirmTime", qualifiedByName = "localDateTimeToInstant")
    Booking toEntity(BookingDTO dto);

    @Named("instantToLocalDateTime")
    default LocalDateTime instantToLocalDateTime(Instant instant) {
        return instant != null ? LocalDateTime.ofInstant(instant, ZoneId.systemDefault()) : null;
    }

    @Named("localDateTimeToInstant")
    default Instant localDateTimeToInstant(LocalDateTime localDateTime) {
        return localDateTime != null ? localDateTime.atZone(ZoneId.systemDefault()).toInstant() : null;
    }

    
}