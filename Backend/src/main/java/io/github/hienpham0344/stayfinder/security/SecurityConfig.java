package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.exception.*;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.access.AccessDeniedHandler;
import java.io.IOException;
import java.time.Clock;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean JwtTokenProvider jwtTokenProvider(@Value("${spring.security.jwt.secret-base64:}") String secret,Clock clock) {
        return new JwtTokenProvider(secret,clock);
    }
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
    @Bean AuthenticationManager authenticationManager(CustomUserDetailsService userDetails,PasswordEncoder encoder) {
        DaoAuthenticationProvider provider=new DaoAuthenticationProvider(userDetails);
        provider.setPasswordEncoder(encoder);return new ProviderManager(provider);
    }
    @Bean AuthenticationEntryPoint authenticationEntryPoint(JsonMapper mapper) {
        return (request,response,exception)->writeError(response,mapper,ErrorCode.UNAUTHORIZED);
    }
    @Bean AccessDeniedHandler accessDeniedHandler(JsonMapper mapper) {
        return (request,response,exception)->writeError(response,mapper,ErrorCode.FORBIDDEN);
    }
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http,JwtTokenProvider jwt,
            CurrentUserJwtConverter converter,AuthenticationEntryPoint entry,AccessDeniedHandler denied) throws Exception {
        // Cookie mutations have an exact Origin plus custom-header boundary enforced by AuthTransport.
        http.csrf(csrf->csrf.disable()).cors(cors->{})
            .sessionManagement(session->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e->e.authenticationEntryPoint(entry).accessDeniedHandler(denied))
            .authorizeHttpRequests(a->a
                .requestMatchers(HttpMethod.POST,"/api/auth/register","/api/auth/login","/api/auth/refresh","/api/auth/logout",
                    "/api/payments/webhook/sepay").permitAll()
                .requestMatchers(HttpMethod.GET,"/actuator/health","/api/catalog/filters","/api/locations/suggestions",
                    "/api/accommodations","/api/accommodations/**","/api/payment-methods").permitAll()
                .requestMatchers("/api/admin/**","/api/demo/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(resource->resource.authenticationEntryPoint(entry).accessDeniedHandler(denied)
                .jwt(config->config.decoder(jwt.decoder()).jwtAuthenticationConverter(converter)));
        return http.build();
    }
    private static void writeError(HttpServletResponse response,JsonMapper mapper,ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(),new ErrorResponse(code.getCode(),code.getMessage(),code.getStatus().value()));
    }
}
