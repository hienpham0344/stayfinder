package io.github.hienpham0344.stayfinder.payment.mapper;

import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {
    @Mapping(target = "paymentCode", expression = "java(io.github.hienpham0344.stayfinder.payment.service.PaymentCode.fromId(entity.getId()))")
    @Mapping(target = "receivingAccountNumber", ignore = true)
    PaymentResponse toResponse(Payment entity);
}
