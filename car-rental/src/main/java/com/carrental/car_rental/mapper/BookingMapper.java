package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.BookingDTO;
import com.carrental.car_rental.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Mapper(componentModel = "spring")
public interface BookingMapper {
    @Mapping(source = "car.model", target = "vehicleName")
    @Mapping(source = "customer.username", target = "customerName")
    @Mapping(source = "startDate", target = "startDate", qualifiedByName = "localDateToLocalDateTime")
    @Mapping(source = "endDate", target = "endDate", qualifiedByName = "localDateToLocalDateTime")
    @Mapping(source = "status.statusName", target = "status")
    @Mapping(source = "depositAmount", target = "totalAmount")
    BookingDTO toDTO(Booking booking);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "car", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "startDate", source = "startDate", qualifiedByName = "localDateTimeToLocalDate")
    @Mapping(target = "endDate", source = "endDate", qualifiedByName = "localDateTimeToLocalDate")
    @Mapping(target = "depositAmount", source = "totalAmount")
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