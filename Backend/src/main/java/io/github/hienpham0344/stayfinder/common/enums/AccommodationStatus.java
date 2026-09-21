package io.github.hienpham0344.stayfinder.common.enums;

public enum AccommodationStatus {
    PENDING("pending"),
    ACTIVE("active"),
    INACTIVE("inactive");

    private final String value;

    AccommodationStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
