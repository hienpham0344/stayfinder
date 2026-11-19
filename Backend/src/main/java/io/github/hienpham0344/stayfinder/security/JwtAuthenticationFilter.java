package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository,
                                   AuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID userId;
        long authVersion;
        try {
            Jwt jwt = jwtService.parseToken(header.substring(7));
            userId = UUID.fromString(jwt.getSubject());
            Object version = jwt.getClaims().get("auth_version");
            if (version == null) {
                authVersion = 0;
            } else if (version instanceof Number number && number.longValue() >= 0
                    && number.doubleValue() == number.longValue()) {
                authVersion = number.longValue();
            } else {
                throw new IllegalArgumentException("Invalid authentication version");
            }
        } catch (JwtException | IllegalArgumentException exception) {
            authenticationEntryPoint.commence(request, response,
                    new BadCredentialsException("Invalid bearer token"));
            return;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRole() == null || !user.isEnabled() || user.getAuthVersion() != authVersion) {
            authenticationEntryPoint.commence(request, response,
                    new BadCredentialsException("Invalid bearer token"));
            return;
        }
        CurrentUser currentUser = new CurrentUser(user.getId(), user.getEmail(), user.getRole());
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                currentUser, null, java.util.List.of(() -> "ROLE_" + currentUser.role().name()));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
