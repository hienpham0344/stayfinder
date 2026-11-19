package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.GlobalExceptionHandler;
import io.github.hienpham0344.stayfinder.config.CorsConfig;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SecurityHttpTest.ProbeController.class, properties = {
        "spring.config.import=",
        "spring.security.jwt.secret-base64=c3RheWZpbmRlci10ZXN0LXNlY3JldC13aXRoLWF0LWxlYXN0LTI1Ni1iaXRzLTEyMzQ1Ng==",
        "spring.web.cors.allowed-origins=https://allowed.example"
})
@Import({SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class, SecurityHttpTest.ProbeController.class})
class SecurityHttpTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwtService;
    @MockitoBean UserRepository users;

    @Test
    void anonymousMayReadPublicCatalogButCannotUsePrivateOrManagementApis() throws Exception {
        mvc.perform(get("/api/accommodations/probe")).andExpect(status().isOk());
        mvc.perform(get("/api/recommendations")).andExpect(status().isOk());
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/partner/probe")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/probe")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/accommodations/probe")).andExpect(status().isUnauthorized());
    }

    @Test
    void customerCannotUsePartnerOrAdminApis() throws Exception {
        String token = token(UserRole.CUSTOMER);
        mvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk());
        mvc.perform(get("/api/partner/probe").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/probe").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isForbidden());
        mvc.perform(get("/actuator/metrics").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isForbidden());
    }

    @Test
    void partnerAndAdminUseSeparateManagementBoundariesAndKeepPersonalApis() throws Exception {
        String partner = token(UserRole.PARTNER);
        mvc.perform(get("/api/partner/probe").header(HttpHeaders.AUTHORIZATION, partner)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/probe").header(HttpHeaders.AUTHORIZATION, partner)).andExpect(status().isForbidden());
        mvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, partner)).andExpect(status().isOk());
        String admin = token(UserRole.ADMIN);
        mvc.perform(get("/api/admin/probe").header(HttpHeaders.AUTHORIZATION, admin)).andExpect(status().isOk());
        mvc.perform(get("/api/partner/probe").header(HttpHeaders.AUTHORIZATION, admin)).andExpect(status().isForbidden());
        mvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, admin)).andExpect(status().isOk());
    }

    @Test
    void revokedDisabledAndForgedTokensAreRejectedByTheRealChain() throws Exception {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setRole(UserRole.CUSTOMER);
        String oldToken = "Bearer " + jwtService.generateToken(user.getId(), user.getEmail(), user.getRole(), 0);
        user.setAuthVersion(1);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        mvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, oldToken)).andExpect(status().isUnauthorized());
        String currentToken = "Bearer " + jwtService.generateToken(user.getId(), user.getEmail(), user.getRole(), 1);
        user.setEnabled(false);
        mvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, currentToken)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer forged")).andExpect(status().isUnauthorized());
    }

    @Test
    void corsPreflightUsesConfiguredOriginsAndSupportsIdempotencyHeader() throws Exception {
        mvc.perform(options("/api/users/me").header(HttpHeaders.ORIGIN, "https://allowed.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PATCH")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type,idempotency-key"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://allowed.example"));
        mvc.perform(options("/api/users/me").header(HttpHeaders.ORIGIN, "https://untrusted.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PATCH"))
                .andExpect(status().isForbidden());
    }

    @Test
    void missingWebhookSignatureIsAClientErrorWithoutInternalDetails() throws Exception {
        mvc.perform(post("/api/payments/webhook/sepay"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    private String token(UserRole role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setRole(role);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return "Bearer " + jwtService.generateToken(user.getId(), user.getEmail(), role, user.getAuthVersion());
    }

    @RestController
    static class ProbeController {
        @GetMapping({"/api/accommodations/probe", "/api/recommendations", "/api/users/me", "/api/partner/probe", "/api/admin/probe"})
        String get() { return "ok"; }

        @PostMapping("/api/accommodations/probe")
        String write() { return "ok"; }

        @PostMapping("/api/payments/webhook/sepay")
        String webhook(@RequestHeader("X-SePay-Signature") String signature) { return "ok"; }
    }
}
