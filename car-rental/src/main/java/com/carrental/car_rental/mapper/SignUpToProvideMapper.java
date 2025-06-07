package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.SignUpToProvideDTO;
import com.carrental.car_rental.entity.SignUpToProvide;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SignUpToProvideMapper {
    @Mapping(source = "id", target = "userId")
    SignUpToProvideDTO toDTO(SignUpToProvide entity);

    @Mapping(source = "userId", target = "id")
    SignUpToProvide toEntity(SignUpToProvideDTO dto);
}