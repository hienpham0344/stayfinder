package io.github.hienpham0344.stayfinder.common.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RoomStatusConverter implements AttributeConverter<RoomStatus, String> {
    @Override
    public String convertToDatabaseColumn(RoomStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public RoomStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        for (RoomStatus status : RoomStatus.values()) if (status.getValue().equals(value)) return status;
        throw new IllegalArgumentException("Unknown room status: " + value);
    }
}
