package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.StatusDTO;
import com.carrental.car_rental.entity.Status;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface StatusMapper {
    StatusDTO toDTO(Status entity);

    Status toEntity(StatusDTO dto);
}