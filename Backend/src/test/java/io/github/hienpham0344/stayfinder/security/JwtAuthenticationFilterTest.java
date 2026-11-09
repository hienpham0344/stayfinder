package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.UUID;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void downstreamIllegalArgumentExceptionIsNotReportedAsInvalidToken() throws Exception {
        UUID userId = UUID.randomUUID();
        JwtService jwtService = mock(JwtService.class);
        UserRepository users = mock(UserRepository.class);
        AuthenticationEntryPoint entryPoint = mock(AuthenticationEntryPoint.class);
        Jwt jwt = Jwt.withTokenValue("valid").header("alg", "HS256").subject(userId.toString())
                .claim("username", "user@example.com").claim("role", "customer")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
        when(jwtService.parseToken("valid")).thenReturn(jwt);
        when(users.findById(userId)).thenReturn(Optional.of(user(userId, UserRole.CUSTOMER)));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid");
        FilterChain downstream = (ignoredRequest, ignoredResponse) -> {
            throw new IllegalArgumentException("downstream bug");
        };

        assertThrows(IllegalArgumentException.class,
                () -> new JwtAuthenticationFilter(jwtService, users, entryPoint).doFilter(
                        request, new MockHttpServletResponse(), downstream));
        verifyNoInteractions(entryPoint);
    }

    @Test
    void usesCurrentDatabaseRoleInsteadOfOldTokenRole() throws Exception {
        UUID userId = UUID.randomUUID();
        JwtService jwtService = mock(JwtService.class);
        UserRepository users = mock(UserRepository.class);
        AuthenticationEntryPoint entryPoint = mock(AuthenticationEntryPoint.class);
        when(jwtService.parseToken("valid")).thenReturn(token(userId, "admin"));
        when(users.findById(userId)).thenReturn(Optional.of(user(userId, UserRole.CUSTOMER)));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid");

        new JwtAuthenticationFilter(jwtService, users, entryPoint).doFilter(
                request, new MockHttpServletResponse(), (ignoredRequest, ignoredResponse) ->
                        assertEquals("ROLE_CUSTOMER", SecurityContextHolder.getContext()
                                .getAuthentication().getAuthorities().iterator().next().getAuthority()));
        verifyNoInteractions(entryPoint);
    }

    @Test
    void rejectsTokenForDeletedUser() throws Exception {
        UUID userId = UUID.randomUUID();
        JwtService jwtService = mock(JwtService.class);
        UserRepository users = mock(UserRepository.class);
        AuthenticationEntryPoint entryPoint = mock(AuthenticationEntryPoint.class);
        when(jwtService.parseToken("valid")).thenReturn(token(userId, "customer"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid");
        FilterChain downstream = mock(FilterChain.class);

        new JwtAuthenticationFilter(jwtService, users, entryPoint).doFilter(
                request, new MockHttpServletResponse(), downstream);
        verify(entryPoint).commence(eq(request), any(), any());
        verifyNoInteractions(downstream);
    }

    private static Jwt token(UUID userId, String role) {
        return Jwt.withTokenValue("valid").header("alg", "HS256").subject(userId.toString())
                .claim("username", "old@example.com").claim("role", role)
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
    }

    private static User user(UUID userId, UserRole role) {
        User user = new User();
        user.setId(userId);
        user.setEmail("current@example.com");
        user.setRole(role);
        return user;
    }
}
