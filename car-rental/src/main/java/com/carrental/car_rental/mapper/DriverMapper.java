package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.DriverDTO;
import com.carrental.car_rental.entity.Driver;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DriverMapper {

    @Mapping(source = "id", target = "driverId")
    @Mapping(source = "supplier.id", target = "userId")
    @Mapping(source = "licenseNumber", target = "licenseNumber")
    DriverDTO toDTO(Driver driver);

    @Mapping(source = "driverId", target = "id")
    @Mapping(source = "userId", target = "supplier.id")
    @Mapping(source = "licenseNumber", target = "licenseNumber")
    Driver toEntity(DriverDTO driverDTO);
}