package io.github.hienpham0344.stayfinder.common.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class BookingStatusConverter implements AttributeConverter<BookingStatus, String> {
    @Override
    public String convertToDatabaseColumn(BookingStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public BookingStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        for (BookingStatus status : BookingStatus.values()) if (status.getValue().equals(value)) return status;
        throw new IllegalArgumentException("Unknown booking status: " + value);
    }
}
