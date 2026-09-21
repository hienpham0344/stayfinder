package io.github.hienpham0344.stayfinder.common.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {
    @Override
    public String convertToDatabaseColumn(PaymentStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        for (PaymentStatus status : PaymentStatus.values()) if (status.getValue().equals(value)) return status;
        throw new IllegalArgumentException("Unknown payment status: " + value);
    }
}
