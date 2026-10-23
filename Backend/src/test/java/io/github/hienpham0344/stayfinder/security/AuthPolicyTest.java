package io.github.hienpham0344.stayfinder.security;
import io.github.hienpham0344.stayfinder.auth.dto.*;
import io.github.hienpham0344.stayfinder.auth.entity.RefreshSession;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.auth.service.AuthServiceImpl;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthPolicyTest {
    private final Clock clock=Clock.fixed(Instant.parse("2026-10-12T12:00:00Z"),ZoneOffset.UTC);
    private final AuthTransport transport=new AuthTransport("https://demo.example,http://localhost:8081",false);
    private MockHttpServletRequest web() {
        MockHttpServletRequest r=new MockHttpServletRequest();r.addHeader("X-Client-Platform","web");
        r.addHeader("Origin","https://demo.example");return r;
    }
    private MockHttpServletRequest nativeRequest() {
        MockHttpServletRequest r=new MockHttpServletRequest();r.addHeader("X-Client-Platform","native");return r;
    }
    private AuthSessionResponse session() {
        return new AuthSessionResponse("access","Bearer",clock.instant().plusSeconds(900),UUID.randomUUID(),
            new UserResponse(UUID.randomUUID(),"Name","name@example.com",null,UserRole.CUSTOMER,null,0L,0),"private-refresh");
    }

    @Test void browserReadsRefreshOnlyFromCookie() {
        MockHttpServletRequest r=web();r.setCookies(new Cookie(AuthTransport.COOKIE_NAME,"cookie-secret"));
        assertEquals("cookie-secret",transport.readRefresh(r,null));
        assertThrows(BusinessException.class,()->transport.readRefresh(r,new RefreshRequest("body-secret")));
    }
    @Test void nativeCannotCrossOverToBrowserOriginOrCookie() {
        MockHttpServletRequest r=nativeRequest();r.addHeader("Origin","https://demo.example");
        assertThrows(BusinessException.class,()->transport.readRefresh(r,new RefreshRequest("secret")));
        MockHttpServletRequest cookie=nativeRequest();cookie.setCookies(new Cookie(AuthTransport.COOKIE_NAME,"secret"));
        assertThrows(BusinessException.class,()->transport.readRefresh(cookie,new RefreshRequest("secret")));
    }
    @Test void webRequiresExactOriginAndHeader() {
        MockHttpServletRequest bad=web();bad.removeHeader("Origin");bad.addHeader("Origin","https://evil.example");
        assertThrows(BusinessException.class,()->transport.platform(bad));
        assertThrows(BusinessException.class,()->transport.platform(new MockHttpServletRequest()));
    }
    @Test void browserResponseNeverSerializesRefreshAndCookieIsProtected() {
        MockHttpServletResponse response=new MockHttpServletResponse();
        AuthSessionResponse body=transport.writeSession(web(),response,session());
        assertNull(body.refreshToken());
        String cookie=response.getHeader("Set-Cookie");assertNotNull(cookie);
        assertTrue(cookie.contains("HttpOnly"));assertTrue(cookie.contains("Secure"));
        assertTrue(cookie.contains("SameSite=Lax"));assertTrue(cookie.contains("Path=/api/auth"));
        String json=JsonMapper.builder().build().writeValueAsString(body);
        assertFalse(json.contains("refreshToken"));assertTrue(json.contains("\"role\":\"customer\""));
    }
    @Test void nativeResponseContainsRefreshWithoutACookie() {
        MockHttpServletResponse response=new MockHttpServletResponse();AuthSessionResponse source=session();
        assertEquals(source,transport.writeSession(nativeRequest(),response,source));
        assertNull(response.getHeader("Set-Cookie"));
    }
    @Test void insecureCookieExceptionIsLimitedToExplicitLocalhost() {
        AuthTransport local=new AuthTransport("http://localhost:8081,https://demo.example",true);
        MockHttpServletResponse response=new MockHttpServletResponse();local.writeSession(web(),response,session());
        assertNotNull(response.getHeader("Set-Cookie"));assertTrue(response.getHeader("Set-Cookie").contains("Secure"));
        MockHttpServletRequest r=web();r.removeHeader("Origin");r.addHeader("Origin","http://localhost:8081");
        MockHttpServletResponse dev=new MockHttpServletResponse();local.writeSession(r,dev,session());
        assertFalse(dev.getHeader("Set-Cookie").contains("; Secure"));
    }
    @Test void failedLoginLimitsAreNormalizedPerEmailAndAlsoPerIp() {
        AuthAttemptLimiter limiter=new AuthAttemptLimiter(clock);
        for(int i=0;i<5;i++)limiter.recordLoginFailure(" Hien@Example.com ","ip-a");
        assertThrows(BusinessException.class,()->limiter.checkLogin("hien@example.com","ip-b"));
        AuthAttemptLimiter byIp=new AuthAttemptLimiter(clock);
        for(int i=0;i<20;i++)byIp.recordLoginFailure("user"+i+"@example.com","ip-a");
        assertThrows(BusinessException.class,()->byIp.checkLogin("new@example.com","ip-a"));
    }
    @Test void registrationLimiterAndCapacityAreBounded() {
        AuthAttemptLimiter limiter=new AuthAttemptLimiter(clock);
        for(int i=0;i<5;i++)limiter.registration("ip-a");
        assertThrows(BusinessException.class,()->limiter.registration("ip-a"));
    }
    @Test void expiredLimiterWindowAllowsAnotherAttempt() {
        MutableClock moving=new MutableClock();AuthAttemptLimiter limiter=new AuthAttemptLimiter(moving);
        for(int i=0;i<5;i++)limiter.recordLoginFailure("name@example.com","ip-a");
        assertThrows(BusinessException.class,()->limiter.checkLogin("name@example.com","ip-a"));
        moving.now=moving.now.plusSeconds(901);
        assertDoesNotThrow(()->limiter.checkLogin("name@example.com","ip-a"));
    }
    @Test void principalUsesCurrentDatabaseRoleAndRejectsRevokedSession() {
        UserRepository users=mock(UserRepository.class);RefreshSessionRepository sessions=mock(RefreshSessionRepository.class);
        UUID id=UUID.randomUUID(),sid=UUID.randomUUID();
        User user=new User();user.setId(id);user.setEmail("name@example.com");user.setRole(UserRole.PARTNER);
        user.setCredentialState("active");user.setPasswordHash("bcrypt-hash");
        RefreshSession s=new RefreshSession();s.setId(sid);s.setUserId(id);s.setExpiresAt(clock.instant().plusSeconds(99));
        when(users.findById(id)).thenReturn(Optional.of(user));when(sessions.findById(sid)).thenReturn(Optional.of(s));
        CurrentUserJwtConverter converter=new CurrentUserJwtConverter(users,sessions,clock);
        Jwt token=Jwt.withTokenValue("test").header("alg","HS256").subject(id.toString()).claim("sid",sid.toString())
            .claim("role","admin").issuedAt(clock.instant()).expiresAt(clock.instant().plusSeconds(90)).build();
        var auth=assertDoesNotThrow(()->converter.convert(token));
        assertEquals(UserRole.PARTNER,((CurrentUser)auth.getPrincipal()).role());
        assertEquals(List.of("ROLE_PARTNER"),auth.getAuthorities().stream().map(a->a.getAuthority()).toList());
        s.setRevokedAt(clock.instant());
        assertThrows(BadCredentialsException.class,()->converter.convert(token));
    }
    static class MutableClock extends Clock {
        Instant now=Instant.parse("2026-10-12T12:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;} public Clock withZone(ZoneId z){return this;}
        public Instant instant(){return now;}
    }
    @Test void replayRevocationExceptionCommitsInsteadOfRollingBack() throws Exception {
        Transactional annotation=AuthServiceImpl.class.getMethod("refresh",String.class).getAnnotation(Transactional.class);
        assertTrue(Arrays.asList(annotation.noRollbackFor()).contains(AuthServiceImpl.SessionReplayException.class));
    }
}
