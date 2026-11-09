package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final AuthService service = new AuthService(users, passwordEncoder, jwtService,
            Mappers.getMapper(UserMapper.class));

    @Test
    void registerStoresOnlyPasswordHashAndReturnsToken() {
        when(passwordEncoder.encode("password123")).thenReturn("bcrypt-hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(), eq("user@example.com"), eq(UserRole.CUSTOMER)))
                .thenReturn("jwt-token");

        var response = service.register("  User  ", " User@Example.com ", "password123");

        org.mockito.ArgumentCaptor<User> captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(captor.capture());
        assertEquals("user@example.com", captor.getValue().getEmail());
        assertEquals("bcrypt-hash", captor.getValue().getPasswordHash());
        assertEquals(UserRole.CUSTOMER, captor.getValue().getRole());
        assertNotNull(captor.getValue().getId());
        assertEquals("jwt-token", response.token());
    }

    @Test
    void loginChecksHashAndDoesNotRevealWhetherAccountExists() {
        User user = new User();
        user.setId(java.util.UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setPasswordHash("bcrypt-hash");
        user.setRole(UserRole.CUSTOMER);
        when(users.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "bcrypt-hash")).thenReturn(true);
        when(jwtService.generateToken(user.getId(), user.getEmail(), UserRole.CUSTOMER))
                .thenReturn("jwt-token");

        assertEquals("jwt-token", service.login(" User@Example.com ", "password123").token());
        assertEquals("UNAUTHORIZED", assertThrows(BusinessException.class,
                () -> service.login("missing@example.com", "password123")).getErrorCode().getCode());
    }
}
