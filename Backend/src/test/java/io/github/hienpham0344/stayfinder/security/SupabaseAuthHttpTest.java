package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.auth.controller.*;
import io.github.hienpham0344.stayfinder.auth.service.SupabaseAuthService;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.config.*;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers={AuthController.class,PasswordRecoveryController.class},properties={
    "stayfinder.auth.mode=supabase","spring.web.cors.allowed-origins=https://demo.example"})
@Import({SecurityConfig.class,CorsConfig.class,ClockConfig.class,CurrentUserJwtConverter.class,
    AuthTransport.class,AuthAttemptLimiter.class,CustomUserDetailsService.class})
class SupabaseAuthHttpTest {
    @Autowired MockMvc mvc;
    @MockitoBean SupabaseAuthService auth;
    @MockitoBean SupabaseJwtDecoder decoder;
    @MockitoBean UserRepository users;
    @MockitoBean RefreshSessionRepository sessions;
    @Test void confirmedEmailRegistrationHasNoFakeSessionAndClearsOldCookie()throws Exception{
        mvc.perform(post("/api/auth/register").header("X-Client-Platform","web").header("Origin","https://demo.example")
            .contentType("application/json").content("{\"email\":\"person@example.com\",\"password\":\"a-long-password\",\"fullName\":\"Person\"}"))
            .andExpect(status().isAccepted()).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(header().string("Set-Cookie",containsString("Max-Age=0")));
    }
    @Test void recoveryWorksWithoutBearerAndDoesNotExposeProof()throws Exception{
        mvc.perform(post("/api/auth/forgot-password").header("X-Client-Platform","native")
            .contentType("application/json").content("{\"email\":\"person@example.com\"}"))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"));
        verify(auth).recover("person@example.com");
    }
    @Test void recoveryRejectsMissingPlatformBoundary()throws Exception{
        mvc.perform(post("/api/auth/forgot-password").contentType("application/json").content("{\"email\":\"person@example.com\"}"))
            .andExpect(status().isForbidden());verifyNoInteractions(auth);
    }
    @Test void shortPasswordNeverReachesProvider()throws Exception{
        mvc.perform(post("/api/auth/reset-password").header("X-Client-Platform","native")
            .contentType("application/json").content("{\"tokenHash\":\"proof\",\"password\":\"short\"}"))
            .andExpect(status().isBadRequest());verifyNoInteractions(auth);
    }
    @Test void resetExchangesBoundedRecoveryProof()throws Exception{
        mvc.perform(post("/api/auth/reset-password").header("X-Client-Platform","native")
            .contentType("application/json").content("{\"tokenHash\":\"proof\",\"password\":\"a-long-password\"}"))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"));
        verify(auth).reset("proof","a-long-password");
    }
}
