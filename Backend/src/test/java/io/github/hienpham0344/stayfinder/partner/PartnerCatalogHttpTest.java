package io.github.hienpham0344.stayfinder.partner;

import io.github.hienpham0344.stayfinder.auth.entity.RefreshSession;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.config.ClockConfig;
import io.github.hienpham0344.stayfinder.config.CorsConfig;
import io.github.hienpham0344.stayfinder.partner.controller.PartnerCatalogController;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomOffer;
import io.github.hienpham0344.stayfinder.partner.service.PartnerAccommodationService;
import io.github.hienpham0344.stayfinder.partner.service.PartnerRoomService;
import io.github.hienpham0344.stayfinder.security.CurrentUserJwtConverter;
import io.github.hienpham0344.stayfinder.security.CustomUserDetailsService;
import io.github.hienpham0344.stayfinder.security.JwtTokenProvider;
import io.github.hienpham0344.stayfinder.security.SecurityConfig;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PartnerCatalogController.class, properties =
        "spring.security.jwt.secret-base64=MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=")
@Import({SecurityConfig.class, CorsConfig.class, ClockConfig.class, CurrentUserJwtConverter.class,
        CustomUserDetailsService.class})
class PartnerCatalogHttpTest {
    private static final String PATH = "/api/partner/accommodations";
    private final UUID userId = UUID.randomUUID();

    @Autowired private MockMvc mvc;
    @Autowired private JwtTokenProvider tokens;
    @MockitoBean private UserRepository users;
    @MockitoBean private RefreshSessionRepository sessions;
    @MockitoBean private PartnerAccommodationService accommodations;
    @MockitoBean private PartnerRoomService rooms;

    @Test
    void deniesAnonymousCustomersAndAdmins() throws Exception {
        mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
        mvc.perform(get(PATH).header("Authorization", token(UserRole.CUSTOMER)))
                .andExpect(status().isForbidden());
        mvc.perform(get(PATH).header("Authorization", token(UserRole.ADMIN)))
                .andExpect(status().isForbidden());

        verifyNoInteractions(accommodations, rooms);
    }

    @Test
    void listsOnlyForAuthenticatedPartner() throws Exception {
        when(accommodations.list(eq(userId), any())).thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0));
        String token = token(UserRole.PARTNER);

        mvc.perform(get(PATH).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result.items").isEmpty());
        mvc.perform(get(PATH).param("size", "101").header("Authorization", token))
                .andExpect(status().isBadRequest());

        verify(accommodations).list(eq(userId), any());
    }

    @Test
    void rejectsInvalidOfferBeforeUpdatingAndPassesPartnerIdentity() throws Exception {
        UUID stayId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        String path = PATH + "/" + stayId + "/rooms/" + roomId + "/offer";
        String token = token(UserRole.PARTNER);

        mvc.perform(put(path).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nightlyPriceCents":-100,"status":"AVAILABLE"}
                        """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(rooms);

        mvc.perform(put(path).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nightlyPriceCents":12000,"status":"MAINTENANCE"}
                        """))
                .andExpect(status().isOk());

        verify(rooms).updateOffer(userId, stayId, roomId, new PartnerRoomOffer(12000L, RoomStatus.MAINTENANCE));
    }

    private String token(UserRole role) {
        UUID sessionId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("partner-test@example.invalid");
        user.setRole(role);
        user.setCredentialState("active");
        user.setPasswordHash("test-hash");
        RefreshSession session = new RefreshSession();
        session.setId(sessionId);
        session.setUserId(userId);
        session.setExpiresAt(Instant.now().plusSeconds(600));
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
        return "Bearer " + tokens.issue(userId, sessionId);
    }
}
