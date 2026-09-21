package io.github.hienpham0344.stayfinder.common.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class UserRoleConverter implements AttributeConverter<UserRole, String> {
    @Override
    public String convertToDatabaseColumn(UserRole attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public UserRole convertToEntityAttribute(String value) {
        if (value == null) return null;
        for (UserRole role : UserRole.values()) if (role.getValue().equals(value)) return role;
        throw new IllegalArgumentException("Unknown user role: " + value);
    }
}
