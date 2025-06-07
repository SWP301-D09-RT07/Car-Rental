package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.PromotionDTO;
import com.carrental.car_rental.entity.Promotion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PromotionMapper {
    @Mapping(source = "code", target = "code")
    PromotionDTO toDTO(Promotion entity);

    @Mapping(source = "code", target = "code")
    Promotion toEntity(PromotionDTO dto);
}