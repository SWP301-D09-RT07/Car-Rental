package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.MaintenanceDTO;
import com.carrental.car_rental.entity.Maintenance;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MaintenanceMapper {
    @Mapping(source = "car.id", target = "carId")
    MaintenanceDTO toDTO(Maintenance entity);

    @Mapping(source = "carId", target = "car.id")
    Maintenance toEntity(MaintenanceDTO dto);
}