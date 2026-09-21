package io.github.hienpham0344.stayfinder.common.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpStatus;

class ErrorCodeContractTest {

    @ParameterizedTest
    @MethodSource("errorCodes")
    void exposesStablePublicContract(ErrorCode errorCode, String code, String message, HttpStatus status) {
        assertEquals(code, errorCode.getCode());
        assertEquals(message, errorCode.getMessage());
        assertEquals(status, errorCode.getStatus());
    }

    private static Stream<Arguments> errorCodes() {
        return Stream.of(
                Arguments.of(ErrorCode.SUCCESS, "SUCCESS", "Success", HttpStatus.OK),
                Arguments.of(ErrorCode.VALIDATION_ERROR, "VALIDATION_ERROR", "Invalid request", HttpStatus.BAD_REQUEST),
                Arguments.of(ErrorCode.UNAUTHORIZED, "UNAUTHORIZED", "Authentication is required", HttpStatus.UNAUTHORIZED),
                Arguments.of(ErrorCode.FORBIDDEN, "FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN),
                Arguments.of(ErrorCode.USER_NOT_FOUND, "USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND),
                Arguments.of(ErrorCode.ACCOMMODATION_NOT_FOUND, "ACCOMMODATION_NOT_FOUND", "Accommodation not found", HttpStatus.NOT_FOUND),
                Arguments.of(ErrorCode.ROOM_NOT_AVAILABLE, "ROOM_NOT_AVAILABLE", "Room is not available", HttpStatus.CONFLICT),
                Arguments.of(ErrorCode.BOOKING_NOT_FOUND, "BOOKING_NOT_FOUND", "Booking not found", HttpStatus.NOT_FOUND),
                Arguments.of(ErrorCode.BOOKING_INVALID_STATE, "BOOKING_INVALID_STATE", "Invalid booking state", HttpStatus.CONFLICT),
                Arguments.of(ErrorCode.BOOKING_SNAPSHOT_REQUIRED, "BOOKING_SNAPSHOT_REQUIRED", "Booking snapshot schema is required", HttpStatus.CONFLICT),
                Arguments.of(ErrorCode.PAYMENT_NOT_FOUND, "PAYMENT_NOT_FOUND", "Payment not found", HttpStatus.NOT_FOUND),
                Arguments.of(ErrorCode.DUPLICATE_RESOURCE, "DUPLICATE_RESOURCE", "Resource already exists", HttpStatus.CONFLICT),
                Arguments.of(ErrorCode.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
}
