package io.github.hienpham0344.stayfinder.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    SUCCESS("SUCCESS", "Success", HttpStatus.OK),
    VALIDATION_ERROR("VALIDATION_ERROR", "Invalid request", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("UNAUTHORIZED", "Authentication is required", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND),
    ACCOMMODATION_NOT_FOUND("ACCOMMODATION_NOT_FOUND", "Accommodation not found", HttpStatus.NOT_FOUND),
    ROOM_NOT_AVAILABLE("ROOM_NOT_AVAILABLE", "Room is not available", HttpStatus.CONFLICT),
    BOOKING_NOT_FOUND("BOOKING_NOT_FOUND", "Booking not found", HttpStatus.NOT_FOUND),
    BOOKING_INVALID_STATE("BOOKING_INVALID_STATE", "Invalid booking state", HttpStatus.CONFLICT),
    BOOKING_SNAPSHOT_REQUIRED("BOOKING_SNAPSHOT_REQUIRED", "Booking snapshot schema is required", HttpStatus.CONFLICT),
    PAYMENT_NOT_FOUND("PAYMENT_NOT_FOUND", "Payment not found", HttpStatus.NOT_FOUND),
    DUPLICATE_RESOURCE("DUPLICATE_RESOURCE", "Resource already exists", HttpStatus.CONFLICT),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus status;

    ErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}
