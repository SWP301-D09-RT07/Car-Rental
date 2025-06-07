package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.CountryCodeDTO;
import com.carrental.car_rental.entity.CountryCode;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CountryCodeMapper {
    CountryCodeDTO toDTO(CountryCode entity);

    CountryCode toEntity(CountryCodeDTO dto);
}