package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.ServiceTypeDTO;
import com.carrental.car_rental.entity.ServiceType;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ServiceTypeMapper {
    ServiceTypeDTO toDTO(ServiceType entity);

    ServiceType toEntity(ServiceTypeDTO dto);
}