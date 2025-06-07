package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.FuelTypeDTO;
import com.carrental.car_rental.entity.FuelType;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FuelTypeMapper {
    FuelTypeDTO toDTO(FuelType entity);

    FuelType toEntity(FuelTypeDTO dto);
}