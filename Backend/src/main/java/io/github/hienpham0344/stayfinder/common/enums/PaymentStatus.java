package io.github.hienpham0344.stayfinder.common.enums;

public enum PaymentStatus {
    PENDING("pending"),
    SUCCESS("success"),
    FAILED("failed"),
    REFUNDED("refunded");

    private final String value;

    PaymentStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
