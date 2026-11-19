package io.github.hienpham0344.stayfinder.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/** Per-instance abuse protection. Proxy headers are intentionally not trusted. */
@Component
public class AuthRateLimiter {
    private final Cache<String, Window> attempts;
    private final Ticker ticker;
    private final long windowNanos;
    private final int loginLimit;
    private final int registrationLimit;

    @Autowired
    public AuthRateLimiter(@Value("${stayfinder.security.login-attempts:10}") int loginLimit,
                           @Value("${stayfinder.security.registration-attempts:10}") int registrationLimit,
                           @Value("${stayfinder.security.rate-limit-window:PT15M}") Duration window,
                           @Value("${stayfinder.security.rate-limit-capacity:10000}") long capacity) {
        this(loginLimit, registrationLimit, window, capacity, Ticker.systemTicker());
    }

    AuthRateLimiter(int loginLimit, int registrationLimit, Duration window, long capacity, Ticker ticker) {
        if (loginLimit < 1 || loginLimit > Integer.MAX_VALUE / 5 || registrationLimit < 1
                || window.isZero() || window.isNegative() || capacity < 1) {
            throw new IllegalArgumentException("Rate limit configuration must be positive");
        }
        this.loginLimit = loginLimit;
        this.registrationLimit = registrationLimit;
        this.windowNanos = window.toNanos();
        this.ticker = ticker;
        this.attempts = Caffeine.newBuilder().maximumSize(capacity).expireAfterWrite(window)
                .ticker(ticker).build();
    }

    public void checkLogin(String email, String remoteAddress) {
        check("login-ip:" + remoteAddress, Math.multiplyExact(loginLimit, 5));
        check("login-account:" + fingerprint(email), loginLimit);
    }

    public void checkRegistration(String remoteAddress) {
        check("registration:" + remoteAddress, registrationLimit);
    }

    private void check(String key, int limit) {
        AtomicBoolean allowed = new AtomicBoolean();
        long now = ticker.read();
        attempts.asMap().compute(key, (ignored, previous) -> {
            Window current = previous == null || now - previous.startedAt() >= windowNanos
                    ? new Window(now, 0) : previous;
            allowed.set(current.count() < limit);
            return new Window(current.startedAt(), Math.min(current.count() + 1, (long) limit));
        });
        if (!allowed.get()) throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS);
    }

    private static String fingerprint(String email) {
        try {
            String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(normalized.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }

    private record Window(long startedAt, long count) { }
}
