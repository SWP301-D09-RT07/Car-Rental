package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.BookingFinancialsDTO;
import com.carrental.car_rental.entity.BookingFinancial;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookingFinancialsMapper {

    @Mapping(target = "bookingId", source = "id")
    @Mapping(target = "totalFare", source = "totalFare")
    @Mapping(target = "appliedDiscount", source = "appliedDiscount")
    @Mapping(target = "lateFeeAmount", source = "lateFeeAmount")
    @Mapping(target = "lateDays", source = "lateDays")
    @Mapping(target = "isDeleted", source = "isDeleted")
    BookingFinancialsDTO toDTO(BookingFinancial entity);

    @Mapping(target = "id", source = "bookingId")
    @Mapping(target = "totalFare", source = "totalFare")
    @Mapping(target = "appliedDiscount", source = "appliedDiscount")
    @Mapping(target = "lateFeeAmount", source = "lateFeeAmount")
    @Mapping(target = "lateDays", source = "lateDays")
    @Mapping(target = "isDeleted", source = "isDeleted")
    @Mapping(target = "booking", ignore = true)
    BookingFinancial toEntity(BookingFinancialsDTO dto);
}