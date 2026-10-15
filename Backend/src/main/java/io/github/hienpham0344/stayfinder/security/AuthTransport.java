package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.auth.dto.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.time.Duration;
import java.util.*;

@Component
public class AuthTransport {
    public static final String COOKIE_NAME="stayfinder_refresh";
    public enum Platform { WEB,NATIVE }
    private final Set<String> origins;
    private final boolean localhostDevelopment;
    public AuthTransport(@Value("${spring.web.cors.allowed-origins:}") String allowedOrigins,
            @Value("${spring.security.auth.localhost-insecure-cookie:false}") boolean localhostDevelopment) {
        this.origins=new HashSet<>(Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(s->!s.isEmpty()).toList());
        if(origins.contains("*"))throw new IllegalArgumentException("Auth requires exact origins");
        this.localhostDevelopment=localhostDevelopment;
    }
    public Platform platform(HttpServletRequest request) {
        String value=request.getHeader("X-Client-Platform");
        String origin=request.getHeader("Origin");
        if("web".equals(value)&&origin!=null&&origins.contains(origin))return Platform.WEB;
        if("native".equals(value)&&origin==null&&cookieRefresh(request)==null)return Platform.NATIVE;
        throw new BusinessException(ErrorCode.FORBIDDEN);
    }
    public String readRefresh(HttpServletRequest request,RefreshRequest body) {
        if(platform(request)==Platform.WEB) {
            if(body!=null&&body.refreshToken()!=null)throw new BusinessException(ErrorCode.FORBIDDEN);
            return cookieRefresh(request);
        }
        return body==null?null:body.refreshToken();
    }
    public AuthSessionResponse writeSession(HttpServletRequest request,HttpServletResponse response,AuthSessionResponse session) {
        response.setHeader("Cache-Control","no-store");
        if(platform(request)==Platform.NATIVE)return session;
        response.addHeader("Set-Cookie",cookie(request,session.refreshToken(),Duration.ofDays(30)).toString());
        response.setHeader("Cache-Control","no-store");
        return session.withoutRefreshToken();
    }
    public void clearCookie(HttpServletRequest request,HttpServletResponse response) {
        if(platform(request)==Platform.WEB)response.addHeader("Set-Cookie",cookie(request,"",Duration.ZERO).toString());
        response.setHeader("Cache-Control","no-store");
    }
    private ResponseCookie cookie(HttpServletRequest request,String token,Duration maxAge) {
        boolean secure=!(localhostDevelopment&&loopback(request.getHeader("Origin")));
        return ResponseCookie.from(COOKIE_NAME,token).httpOnly(true).secure(secure).sameSite("Lax")
                .path("/api/auth").maxAge(maxAge).build();
    }
    private static boolean loopback(String value) {
        try {
            URI uri=URI.create(value);
            return "http".equals(uri.getScheme())&&Set.of("localhost","127.0.0.1","[::1]","::1").contains(uri.getHost());
        } catch(IllegalArgumentException exception){return false;}
    }
    private static String cookieRefresh(HttpServletRequest request) {
        Cookie[] cookies=request.getCookies();if(cookies==null)return null;
        String value=null;
        for(Cookie cookie:cookies)if(COOKIE_NAME.equals(cookie.getName())) {
            if(value!=null)throw new BusinessException(ErrorCode.FORBIDDEN);
            value=cookie.getValue();
        }
        return value;
    }
}
