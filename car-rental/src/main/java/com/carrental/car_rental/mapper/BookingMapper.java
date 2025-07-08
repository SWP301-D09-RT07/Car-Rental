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
    @Mapping(source = "status", target = "status")
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
}