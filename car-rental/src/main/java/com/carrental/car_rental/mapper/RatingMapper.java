package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.RatingDTO;
import com.carrental.car_rental.entity.Rating;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = CommonMapper.class)
public interface RatingMapper {
    @Mapping(source = "id", target = "id")
    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.username", target = "customerName")
    @Mapping(source = "ratingScore", target = "ratingScore")
    @Mapping(source = "comment", target = "comment")
    @Mapping(source = "ratingDate", target = "ratingDate", qualifiedByName = "instantToLocalDateTime")
    RatingDTO toDTO(Rating entity);

    @Mapping(source = "id", target = "id")
    @Mapping(source = "customerId", target = "customer.id")
    @Mapping(source = "ratingScore", target = "ratingScore")
    @Mapping(source = "comment", target = "comment")
    @Mapping(source = "ratingDate", target = "ratingDate", qualifiedByName = "localDateTimeToInstant")
    Rating toEntity(RatingDTO dto);
}