package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.CarBrandDTO;
import com.carrental.car_rental.entity.CarBrand;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CarBrandMapper {
    @Mapping(source = "id", target = "carBrandId")
        // Ánh xạ id sang carBrandId
    CarBrandDTO toDTO(CarBrand entity);

    @Mapping(source = "carBrandId", target = "id") // Ánh xạ ngược lại
    CarBrand toEntity(CarBrandDTO dto);
}