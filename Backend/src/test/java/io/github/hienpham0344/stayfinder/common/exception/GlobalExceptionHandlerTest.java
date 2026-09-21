package io.github.hienpham0344.stayfinder.common.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void mapsBusinessExceptionsUsingTheirConfiguredPublicContract() {
        ResponseEntity<ErrorResponse> response = handler.handleBusinessException(
                new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE));

        assertResponse(response, ErrorCode.ROOM_NOT_AVAILABLE);
    }

    @Test
    void mapsAuthenticationFailuresWithoutLeakingTheCredentialFailure() {
        ResponseEntity<ErrorResponse> response = handler.handleAuthenticationException(
                new BadCredentialsException("database password was rejected"));

        assertResponse(response, ErrorCode.UNAUTHORIZED);
        assertFalse(response.getBody().getMessage().contains("database password"));
    }

    @Test
    void mapsAuthorizationFailuresWithoutLeakingTheAuthorizationDetail() {
        ResponseEntity<ErrorResponse> response = handler.handleAccessDeniedException(
                new AccessDeniedException("requires ADMIN role"));

        assertResponse(response, ErrorCode.FORBIDDEN);
        assertFalse(response.getBody().getMessage().contains("ADMIN"));
    }

    @Test
    void mapsDataIntegrityFailuresWithoutLeakingConstraintDetails() {
        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolationException(
                new DataIntegrityViolationException("unique constraint users_email_key"));

        assertResponse(response, ErrorCode.DUPLICATE_RESOURCE);
        assertFalse(response.getBody().getMessage().contains("users_email_key"));
    }

    @Test
    void mapsUnexpectedFailuresToTheStableInternalErrorContract() {
        ResponseEntity<ErrorResponse> response = handler.handleUnexpectedException(
                new IllegalStateException("connection string leaked"));

        assertResponse(response, ErrorCode.INTERNAL_SERVER_ERROR);
        assertFalse(response.getBody().getMessage().contains("connection string"));
    }

    private void assertResponse(ResponseEntity<ErrorResponse> response, ErrorCode errorCode) {
        assertEquals(errorCode.getStatus(), response.getStatusCode());
        assertEquals(errorCode.getCode(), response.getBody().getCode());
        assertEquals(errorCode.getMessage(), response.getBody().getMessage());
        assertEquals(errorCode.getStatus().value(), response.getBody().getStatus());
    }
}
