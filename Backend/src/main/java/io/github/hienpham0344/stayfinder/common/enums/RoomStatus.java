package io.github.hienpham0344.stayfinder.common.enums;

public enum RoomStatus {
    AVAILABLE("available"),
    MAINTENANCE("maintenance"),
    UNAVAILABLE("unavailable");

    private final String value;

    RoomStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
