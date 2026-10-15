package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;
import java.util.function.Supplier;

// Bounded, single-instance demo limiter. Distributed deployment requires a shared limiter.
@Component
public class AuthAttemptLimiter {
    private static final int MAX_KEYS=10_000;
    private final Clock clock;
    private final Map<String,Window> windows=new HashMap<>();
    public AuthAttemptLimiter(Clock clock){this.clock=clock;}

    // Admission reserves both buckets atomically; slow password checks run outside the monitor.
    public <T> T loginAttempt(String email,String ip,Supplier<T> authentication) {
        Window[] reserved=reserveLogin(email,ip);boolean failed=false;
        try{return authentication.get();}
        catch(BusinessException exception){failed=exception.getErrorCode()==ErrorCode.INVALID_CREDENTIALS;throw exception;}
        finally{finishLogin(reserved,failed);}
    }
    private synchronized Window[] reserveLogin(String email,String ip){
        String emailKey="email:"+normalize(email),ipKey="login-ip:"+ip;
        check(emailKey,5);check(ipKey,20);
        Instant now=clock.instant();
        windows.entrySet().removeIf(e->e.getValue().inFlight==0&&!now.isBefore(e.getValue().expiresAt));
        int needed=(windows.containsKey(emailKey)?0:1)+(windows.containsKey(ipKey)?0:1);
        if(windows.size()+needed>MAX_KEYS)throw new BusinessException(ErrorCode.RATE_LIMITED);
        Window byEmail=windows.computeIfAbsent(emailKey,k->new Window(now.plus(Duration.ofMinutes(15)),0));
        Window byIp=windows.computeIfAbsent(ipKey,k->new Window(now.plus(Duration.ofMinutes(15)),0));
        byEmail.inFlight++;byIp.inFlight++;return new Window[]{byEmail,byIp};
    }
    private synchronized void finishLogin(Window[] reserved,boolean failed){
        Instant now=clock.instant();
        for(Window window:reserved){resetExpired(window,now);window.inFlight--;if(failed)window.count++;}
    }
    public synchronized void checkLogin(String email,String ip) {
        check("email:"+normalize(email),5);check("login-ip:"+ip,20);
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
        if(value!=null&&!clock.instant().isBefore(value.expiresAt)){
            if(value.inFlight==0){windows.remove(key);value=null;}
            else resetExpired(value,clock.instant());
        }
        if(value!=null&&value.count+value.inFlight>=limit)throw new BusinessException(ErrorCode.RATE_LIMITED);
    }
    private void resetExpired(Window window,Instant now){
        if(!now.isBefore(window.expiresAt)){window.count=0;window.expiresAt=now.plus(Duration.ofMinutes(15));}
    }
    private void increment(String key,Duration duration) {
        Instant now=clock.instant();Window old=windows.get(key);
        if(old!=null&&now.isBefore(old.expiresAt)){old.count++;return;}
        if(windows.size()>=MAX_KEYS) {
            windows.entrySet().removeIf(e->e.getValue().inFlight==0&&!now.isBefore(e.getValue().expiresAt));
            if(windows.size()>=MAX_KEYS)throw new BusinessException(ErrorCode.RATE_LIMITED);
        }
        windows.put(key,new Window(now.plus(duration),1));
    }
    private static String normalize(String email){return email==null?"":email.trim().toLowerCase(Locale.ROOT);}
    private static class Window {
        Instant expiresAt;int count,inFlight;
        Window(Instant expiresAt,int count){this.expiresAt=expiresAt;this.count=count;}
    }
}
