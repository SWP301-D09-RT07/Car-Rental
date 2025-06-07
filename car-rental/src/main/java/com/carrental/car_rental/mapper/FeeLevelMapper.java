package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.FeeLevelDTO;
import com.carrental.car_rental.entity.FeeLevel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FeeLevelMapper {
    FeeLevelDTO toDTO(FeeLevel entity);

    FeeLevel toEntity(FeeLevelDTO dto);
}