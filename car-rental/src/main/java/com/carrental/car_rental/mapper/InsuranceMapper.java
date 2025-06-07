package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.InsuranceDTO;
import com.carrental.car_rental.entity.Insurance;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InsuranceMapper {
    @Mapping(source = "id", target = "bookingId")
    InsuranceDTO toDTO(Insurance entity);

    @Mapping(source = "bookingId", target = "id")
    Insurance toEntity(InsuranceDTO dto);
}