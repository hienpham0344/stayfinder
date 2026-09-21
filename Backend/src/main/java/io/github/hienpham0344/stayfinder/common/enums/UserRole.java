package io.github.hienpham0344.stayfinder.common.enums;

public enum UserRole {
    ADMIN("admin"),
    PARTNER("partner"),
    CUSTOMER("customer");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static UserRole fromValue(String value) {
        for (UserRole role : values()) if (role.value.equals(value)) return role;
        throw new IllegalArgumentException("Unknown user role");
    }
}
