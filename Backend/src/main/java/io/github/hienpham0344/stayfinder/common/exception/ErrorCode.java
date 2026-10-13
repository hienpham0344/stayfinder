package io.github.hienpham0344.stayfinder.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    SUCCESS("SUCCESS", "Success", HttpStatus.OK),
    VALIDATION_ERROR("VALIDATION_ERROR", "Invalid request", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("UNAUTHORIZED", "Authentication is required", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED),
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email already exists", HttpStatus.CONFLICT),
    SESSION_EXPIRED("SESSION_EXPIRED", "Session has expired", HttpStatus.UNAUTHORIZED),
    SESSION_REVOKED("SESSION_REVOKED", "Session was revoked", HttpStatus.UNAUTHORIZED),
    REFRESH_RETRY("REFRESH_RETRY", "Refresh is already in progress", HttpStatus.CONFLICT),
    RATE_LIMITED("RATE_LIMITED", "Too many attempts", HttpStatus.TOO_MANY_REQUESTS),
    USER_NOT_FOUND("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND),
    ACCOMMODATION_NOT_FOUND("ACCOMMODATION_NOT_FOUND", "Accommodation not found", HttpStatus.NOT_FOUND),
    ROOM_NOT_AVAILABLE("ROOM_NOT_AVAILABLE", "Room is not available", HttpStatus.CONFLICT),
    QUOTE_NOT_FOUND("QUOTE_NOT_FOUND", "Quote not found", HttpStatus.NOT_FOUND),
    QUOTE_EXPIRED("QUOTE_EXPIRED", "Quote has expired; request a new quote", HttpStatus.CONFLICT),
    QUOTE_ALREADY_USED("QUOTE_ALREADY_USED", "Quote was already used", HttpStatus.CONFLICT),
    QUOTE_CHANGED("QUOTE_CHANGED", "Quote terms changed; request a new quote", HttpStatus.CONFLICT),
    BOOKING_NOT_FOUND("BOOKING_NOT_FOUND", "Booking not found", HttpStatus.NOT_FOUND),
    CANCELLATION_NOT_ALLOWED("CANCELLATION_NOT_ALLOWED", "Cancellation is not allowed", HttpStatus.CONFLICT),
    BOOKING_INVALID_STATE("BOOKING_INVALID_STATE", "Invalid booking state", HttpStatus.CONFLICT),
    BOOKING_SNAPSHOT_REQUIRED("BOOKING_SNAPSHOT_REQUIRED", "Booking snapshot schema is required", HttpStatus.CONFLICT),
    PAYMENT_NOT_FOUND("PAYMENT_NOT_FOUND", "Payment not found", HttpStatus.NOT_FOUND),
    IDEMPOTENCY_CONFLICT("IDEMPOTENCY_CONFLICT", "Request key was already used with different content", HttpStatus.CONFLICT),
    INSUFFICIENT_POINTS("INSUFFICIENT_POINTS", "Insufficient available points", HttpStatus.UNPROCESSABLE_ENTITY),
    REWARD_INELIGIBLE("REWARD_INELIGIBLE", "Reward cannot be used for this request", HttpStatus.UNPROCESSABLE_ENTITY),
    VOUCHER_EXPIRED("VOUCHER_EXPIRED", "Voucher has expired", HttpStatus.UNPROCESSABLE_ENTITY),
    DUPLICATE_RESOURCE("DUPLICATE_RESOURCE", "Resource already exists", HttpStatus.CONFLICT),
    DEPENDENCY_UNAVAILABLE("DEPENDENCY_UNAVAILABLE", "Service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),
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
