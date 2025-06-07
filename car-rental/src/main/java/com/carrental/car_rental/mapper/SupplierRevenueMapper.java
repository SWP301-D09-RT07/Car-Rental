package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.SupplierRevenueDTO;
import com.carrental.car_rental.entity.SupplierRevenue;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SupplierRevenueMapper {
    @Mapping(source = "supplier.id", target = "supplierId")
    @Mapping(source = "supplier.email", target = "supplierEmail")
    SupplierRevenueDTO toDTO(SupplierRevenue entity);

    @Mapping(source = "supplierId", target = "supplier.id")
    SupplierRevenue toEntity(SupplierRevenueDTO dto);
}