package io.github.hienpham0344.stayfinder.user;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.dto.ChangePasswordRequest;
import io.github.hienpham0344.stayfinder.user.dto.UpdateProfileRequest;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.user.service.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final UserServiceImpl service = new UserServiceImpl(users, Mappers.getMapper(UserMapper.class), encoder);
    private User user;

    @BeforeEach
    void authenticate() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setRole(UserRole.CUSTOMER);
        user.setLoyaltyPoints(500);
        user.setPasswordHash("old-hash");
        when(users.lockById(user.getId())).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(user.getId(), user.getEmail(), user.getRole()), null, List.of()));
    }

    @AfterEach
    void clear() { SecurityContextHolder.clearContext(); }

    @Test
    void profileOnlyChangesPermittedFieldsAndUsesTheAuthenticatedOwner() {
        var result = service.updateProfile(new UpdateProfileRequest(" New name ", "+84912345678", "https://example.com/avatar.png"));
        assertEquals("New name", result.fullName());
        assertEquals(UserRole.CUSTOMER, result.role());
        assertEquals(500, result.loyaltyPoints());
        assertEquals("user@example.com", result.email());
        verify(users).lockById(user.getId());
        assertEquals("old-hash", user.getPasswordHash());
    }

    @Test
    void correctPasswordChangesHashAndInvalidatesAllOldTokens() {
        when(encoder.matches("old-password", "old-hash")).thenReturn(true);
        when(encoder.encode("new-password")).thenReturn("new-hash");
        service.changePassword(new ChangePasswordRequest("old-password", "new-password"));
        assertEquals("new-hash", user.getPasswordHash());
        assertEquals(1, user.getAuthVersion());
        verify(users).save(user);
    }

    @Test
    void wrongPasswordLeavesHashAndVersionUntouched() {
        assertThrows(BusinessException.class,
                () -> service.changePassword(new ChangePasswordRequest("wrong", "new-password")));
        assertEquals("old-hash", user.getPasswordHash());
        assertEquals(0, user.getAuthVersion());
        verify(users, never()).save(any());
    }

    @Test
    void rejectsPasswordExceedingBcryptUtf8ByteLimit() {
        when(encoder.matches("old-password", "old-hash")).thenReturn(true);
        assertEquals("VALIDATION_ERROR", assertThrows(BusinessException.class,
                () -> service.changePassword(new ChangePasswordRequest("old-password", "ế".repeat(30))))
                .getErrorCode().getCode());
        verify(users, never()).save(any());
    }

    @Test
    void logoutInvalidatesTokensWithoutChangingCredentials() {
        user.setAuthVersion(7);
        service.logoutAll();
        assertEquals(8, user.getAuthVersion());
        assertEquals("old-hash", user.getPasswordHash());
    }

    @Test
    void httpProfilePayloadCannotChangeRolePointsOrCredentials() throws Exception {
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders
                .standaloneSetup(new io.github.hienpham0344.stayfinder.user.controller.UserController(service))
                .setControllerAdvice(new io.github.hienpham0344.stayfinder.common.exception.GlobalExceptionHandler())
                .build();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/users/me")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\",\"loyaltyPoints\":99999,\"enabled\":false,\"passwordHash\":\"injected\"}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        assertNull(user.getFullName());
        assertEquals(UserRole.CUSTOMER, user.getRole());
        assertEquals(500, user.getLoyaltyPoints());
        assertEquals("old-hash", user.getPasswordHash());
        assertTrue(user.isEnabled());
    }
}
