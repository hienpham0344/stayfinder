package io.github.hienpham0344.stayfinder.payment;

import io.github.hienpham0344.stayfinder.auth.entity.RefreshSession;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.config.*;
import io.github.hienpham0344.stayfinder.payment.controller.PaymentSimulationController;
import io.github.hienpham0344.stayfinder.payment.dto.SimulationOutcome;
import io.github.hienpham0344.stayfinder.payment.service.PaymentSimulationService;
import io.github.hienpham0344.stayfinder.security.*;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PaymentSimulationController.class, properties =
        "spring.security.jwt.secret-base64=MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=")
@Import({SecurityConfig.class, CorsConfig.class, ClockConfig.class, CurrentUserJwtConverter.class,
        CustomUserDetailsService.class})
class PaymentSimulationHttpTest {
    final UUID owner = UUID.randomUUID();
    final UUID booking = UUID.randomUUID();
    final String path = "/api/bookings/" + booking + "/payment-simulations";
    @Autowired MockMvc mvc;
    @Autowired JwtTokenProvider tokens;
    @MockitoBean UserRepository users;
    @MockitoBean RefreshSessionRepository sessions;
    @MockitoBean PaymentSimulationService simulations;

    @Test void rejectsAnonymousPartnerAndAdmin() throws Exception {
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{\"outcome\":\"SUCCESS\"}")
                .header("Idempotency-Key", "one")).andExpect(status().isUnauthorized());
        for (UserRole role : List.of(UserRole.PARTNER, UserRole.ADMIN)) {
            mvc.perform(post(path).header("Authorization", token(role)).header("Idempotency-Key", "one")
                    .contentType(MediaType.APPLICATION_JSON).content("{\"outcome\":\"SUCCESS\"}"))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(simulations);
    }

    @Test void validatesOutcomeAndPassesAuthenticatedOwnerToService() throws Exception {
        String token = token(UserRole.CUSTOMER);
        mvc.perform(post(path).header("Authorization", token).header("Idempotency-Key", "one")
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"outcome\":\"SUCCESS\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization", token).header("Idempotency-Key", "one")
                .contentType(MediaType.APPLICATION_JSON).content("{\"outcome\":\"FORCE_PAID\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(simulations);
        mvc.perform(post(path).header("Authorization", token).header("Idempotency-Key", "one")
                .contentType(MediaType.APPLICATION_JSON).content("{\"outcome\":\"SUCCESS\"}"))
                .andExpect(status().isOk());
        verify(simulations).simulate(owner, booking, SimulationOutcome.SUCCESS, "one");
    }

    private String token(UserRole role) {
        UUID sessionId = UUID.randomUUID();
        User user = new User(); user.setId(owner); user.setEmail("simulation@example.invalid");
        user.setRole(role); user.setCredentialState("active"); user.setPasswordHash("test-hash");
        RefreshSession session = new RefreshSession(); session.setId(sessionId); session.setUserId(owner);
        session.setExpiresAt(Instant.now().plusSeconds(600));
        when(users.findById(owner)).thenReturn(Optional.of(user));
        when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
        return "Bearer " + tokens.issue(owner, sessionId);
    }
}
