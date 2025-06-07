package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.RoleDTO;
import com.carrental.car_rental.entity.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    RoleDTO toDTO(Role entity);

    Role toEntity(RoleDTO dto);
}