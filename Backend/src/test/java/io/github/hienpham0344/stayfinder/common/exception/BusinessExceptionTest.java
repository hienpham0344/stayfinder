package io.github.hienpham0344.stayfinder.common.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class BusinessExceptionTest {

    @Test
    void exposesTheSuppliedErrorCodeWithoutAcceptingAnInternalMessage() {
        BusinessException exception = new BusinessException(ErrorCode.BOOKING_NOT_FOUND);

        assertEquals(ErrorCode.BOOKING_NOT_FOUND, exception.getErrorCode());
        assertEquals("Booking not found", exception.getMessage());
    }
}
