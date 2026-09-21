package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.common.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    JwtService jwtService(@Value("${spring.security.jwt.secret-base64:}") String secret,
                          @Value("${spring.security.jwt.expiration-minutes:60}") long expirationMinutes) {
        if (secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET_BASE64 must be configured");
        }
        return new JwtService(secret, expirationMinutes);
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationEntryPoint authenticationEntryPoint(JsonMapper objectMapper) {
        return (request, response, exception) -> writeError(response, objectMapper, ErrorCode.UNAUTHORIZED);
    }

    @Bean
    AccessDeniedHandler accessDeniedHandler(JsonMapper objectMapper) {
        return (request, response, exception) -> writeError(response, objectMapper, ErrorCode.FORBIDDEN);
    }

    @Bean
    JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService,
                                                     AuthenticationEntryPoint authenticationEntryPoint) {
        return new JwtAuthenticationFilter(jwtService, authenticationEntryPoint);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                             JwtAuthenticationFilter jwtAuthenticationFilter,
                                             AuthenticationEntryPoint authenticationEntryPoint,
                                             AccessDeniedHandler accessDeniedHandler) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/register", "/api/auth/login",
                                "/api/payments/webhook/sepay", "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/accommodations", "/api/accommodations/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void writeError(HttpServletResponse response, JsonMapper objectMapper, ErrorCode errorCode)
            throws IOException {
        response.setStatus(errorCode.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(),
                new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), errorCode.getStatus().value()));
    }
}
