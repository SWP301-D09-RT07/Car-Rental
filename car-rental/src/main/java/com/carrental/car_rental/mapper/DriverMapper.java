package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.DriverDTO;
import com.carrental.car_rental.entity.Driver;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DriverMapper {

    @Mapping(source = "supplier.id", target = "userId")
    DriverDTO toDTO(Driver driver);

    @Mapping(source = "userId", target = "supplier.id")
    Driver toEntity(DriverDTO driverDTO);
}