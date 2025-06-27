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
@Mapper(componentModel = "spring", uses = {CommonMapper.class, UserMapper.class, CarMapper.class})
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
    @Mapping(source = "startDate", target = "pickupDateTime", qualifiedByName = "localDateToLocalDateTime")
    @Mapping(source = "endDate", target = "dropoffDateTime", qualifiedByName = "localDateToLocalDateTime")
    @Mapping(source = "createdAt", target = "createdAt", qualifiedByName = "instantToLocalDateTime")
    @Mapping(source = "updatedAt", target = "updatedAt", qualifiedByName = "instantToLocalDateTime")
    @Mapping(target = "withDriver", source = "withDriver")
    @Mapping(target = "deliveryRequested", constant = "false")
    @Mapping(target = "estimatedOvertimeHours", constant = "0")
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
    @Mapping(source = "pickupDateTime", target = "startDate", qualifiedByName = "localDateTimeToLocalDate")
    @Mapping(source = "dropoffDateTime", target = "endDate", qualifiedByName = "localDateTimeToLocalDate")
    @Mapping(source = "createdAt", target = "createdAt", qualifiedByName = "localDateTimeToInstant")
    @Mapping(source = "updatedAt", target = "updatedAt", qualifiedByName = "localDateTimeToInstant")
    Booking toEntity(BookingDTO dto);

    @Named("localDateToLocalDateTime")
    default LocalDateTime localDateToLocalDateTime(LocalDate localDate) {
        return localDate != null ? localDate.atStartOfDay() : null;
    }

    @Named("localDateTimeToLocalDate")
    default LocalDate localDateTimeToLocalDate(LocalDateTime localDateTime) {
        return localDateTime != null ? localDateTime.toLocalDate() : null;
    }
    
//    public BookingDTO toDto(Booking booking) {
//        return toDTO(booking);
//    }
}