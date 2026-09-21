package io.github.hienpham0344.stayfinder.payment.mapper;

import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentMapper {
    PaymentResponse toResponse(Payment entity);
}
