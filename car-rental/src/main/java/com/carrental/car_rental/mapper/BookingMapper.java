package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Mapper(componentModel = "spring", uses = CommonMapper.class)
public interface BookingMapper {
    @Mapping(source = "id", target = "bookingId")
    @Mapping(source = "customer.id", target = "userId")
    @Mapping(source = "car.id", target = "carId")
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
    @Mapping(source = "endDate", target = "dropoffDate", qualifiedByName = "localDateToLocalDateTime")
    @Mapping(source = "createdAt", target = "createdAt", qualifiedByName = "instantToLocalDateTime")
    @Mapping(source = "updatedAt", target = "updatedAt", qualifiedByName = "instantToLocalDateTime")
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
    @Mapping(source = "dropoffDate", target = "endDate", qualifiedByName = "localDateTimeToLocalDate")
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