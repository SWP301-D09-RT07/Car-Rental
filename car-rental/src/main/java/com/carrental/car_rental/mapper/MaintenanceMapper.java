package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.MaintenanceDTO;
import com.carrental.car_rental.entity.Maintenance;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Mapper(componentModel = "spring")
public interface MaintenanceMapper {
    @Mapping(source = "id", target = "maintenanceId")
    @Mapping(source = "car.id", target = "carId")
    @Mapping(source = "car.licensePlate", target = "carLicensePlate")
    @Mapping(source = "description", target = "maintenanceDetails")
    @Mapping(source = "cost", target = "maintenanceCost")
    @Mapping(source = "startDate", target = "maintenanceDate", qualifiedByName = "localDateToLocalDateTime")
    MaintenanceDTO toDTO(Maintenance entity);

    @Mapping(source = "maintenanceId", target = "id")
    @Mapping(source = "carId", target = "car.id")
    @Mapping(source = "maintenanceDetails", target = "description")
    @Mapping(source = "maintenanceCost", target = "cost")
    @Mapping(source = "maintenanceDate", target = "startDate", qualifiedByName = "localDateTimeToLocalDate")
    Maintenance toEntity(MaintenanceDTO dto);

    @Named("localDateToLocalDateTime")
    default LocalDateTime localDateToLocalDateTime(LocalDate localDate) {
        return localDate != null ? localDate.atStartOfDay() : null;
    }

    @Named("localDateTimeToLocalDate")
    default LocalDate localDateTimeToLocalDate(LocalDateTime localDateTime) {
        return localDateTime != null ? localDateTime.toLocalDate() : null;
    }
}