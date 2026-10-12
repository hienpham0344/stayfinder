package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;

// Bounded, single-instance demo limiter. Distributed deployment requires a shared limiter.
@Component
public class AuthAttemptLimiter {
    private static final int MAX_KEYS=10_000;
    private final Clock clock;
    private final Map<String,Window> windows=new HashMap<>();
    public AuthAttemptLimiter(Clock clock){this.clock=clock;}

    public synchronized void checkLogin(String email,String ip) {
        check("email:"+normalize(email),5);
        check("login-ip:"+ip,20);
    }
    public synchronized void recordLoginFailure(String email,String ip) {
        increment("email:"+normalize(email),Duration.ofMinutes(15));
        increment("login-ip:"+ip,Duration.ofMinutes(15));
    }
    public synchronized void registration(String ip) {
        check("register:"+ip,5);increment("register:"+ip,Duration.ofHours(1));
    }
    public synchronized void credentialChange(UUID userId,String ip) {
        check("change-user:"+userId,5);check("change-ip:"+ip,20);
        increment("change-user:"+userId,Duration.ofMinutes(15));
        increment("change-ip:"+ip,Duration.ofMinutes(15));
    }
    private void check(String key,int limit) {
        Window value=windows.get(key);
        if(value!=null&&!clock.instant().isBefore(value.expiresAt)){windows.remove(key);value=null;}
        if(value!=null&&value.count>=limit)throw new BusinessException(ErrorCode.RATE_LIMITED);
    }
    private void increment(String key,Duration duration) {
        Instant now=clock.instant();Window old=windows.get(key);
        if(old!=null&&now.isBefore(old.expiresAt)){old.count++;return;}
        if(windows.size()>=MAX_KEYS) {
            windows.entrySet().removeIf(e->!now.isBefore(e.getValue().expiresAt));
            if(windows.size()>=MAX_KEYS)throw new BusinessException(ErrorCode.RATE_LIMITED);
        }
        windows.put(key,new Window(now.plus(duration)));
    }
    private static String normalize(String email){return email==null?"":email.trim().toLowerCase(Locale.ROOT);}
    private static class Window {
        final Instant expiresAt;int count=1;
        Window(Instant expiresAt){this.expiresAt=expiresAt;}
    }
}
