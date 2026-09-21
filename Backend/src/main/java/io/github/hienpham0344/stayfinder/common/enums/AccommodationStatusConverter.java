package io.github.hienpham0344.stayfinder.common.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AccommodationStatusConverter implements AttributeConverter<AccommodationStatus, String> {
    @Override
    public String convertToDatabaseColumn(AccommodationStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public AccommodationStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        for (AccommodationStatus status : AccommodationStatus.values()) if (status.getValue().equals(value)) return status;
        throw new IllegalArgumentException("Unknown accommodation status: " + value);
    }
}
