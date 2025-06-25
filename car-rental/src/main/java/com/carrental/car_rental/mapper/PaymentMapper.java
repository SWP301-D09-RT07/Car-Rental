package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.PaymentDTO;
import com.carrental.car_rental.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = CommonMapper.class)
public interface PaymentMapper {
    @Mapping(target = "bookingId", source = "booking.id")
    @Mapping(target = "currency", source = "region.currency")
    @Mapping(target = "statusName", source = "paymentStatus.statusName")
    @Mapping(target = "paymentDate", expression = "java(entity.getPaymentDate() != null ? entity.getPaymentDate().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)")
    PaymentDTO toDTO(Payment entity);

    @Mapping(target = "booking", ignore = true)
    @Mapping(target = "region", ignore = true)
    @Mapping(target = "paymentStatus", ignore = true)
    @Mapping(target = "paymentDate", expression = "java(dto.getPaymentDate() != null ? java.time.Instant.from(dto.getPaymentDate().atZone(java.time.ZoneId.systemDefault())) : null)")
    Payment toEntity(PaymentDTO dto);
}