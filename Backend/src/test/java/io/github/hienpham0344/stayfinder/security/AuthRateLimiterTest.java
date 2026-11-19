package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;
import static org.junit.jupiter.api.Assertions.*;

class AuthRateLimiterTest {
    private final AtomicLong nanos = new AtomicLong();
    private final AuthRateLimiter limiter = new AuthRateLimiter(2, 2, Duration.ofMinutes(15), 100, nanos::get);

    @Test
    void accountLimitCannotBeBypassedByCaseWhitespaceOrDifferentIp() {
        limiter.checkLogin("USER@example.com", "127.0.0.1");
        limiter.checkLogin(" user@example.com ", "127.0.0.2");
        assertEquals("TOO_MANY_REQUESTS", assertThrows(BusinessException.class,
                () -> limiter.checkLogin("user@example.com", "127.0.0.3")).getErrorCode().getCode());
    }

    @Test
    void windowResetsWithoutSleepingAndAccountsRemainIndependent() {
        limiter.checkLogin("a@example.com", "127.0.0.1");
        limiter.checkLogin("a@example.com", "127.0.0.1");
        assertDoesNotThrow(() -> limiter.checkLogin("b@example.com", "127.0.0.1"));
        nanos.addAndGet(Duration.ofMinutes(15).toNanos());
        assertDoesNotThrow(() -> limiter.checkLogin("a@example.com", "127.0.0.1"));
    }

    @Test
    void registrationLimitIsAtomicUnderParallelRequests() {
        long successes = IntStream.range(0, 30).parallel().filter(ignored -> {
            try {
                limiter.checkRegistration("127.0.0.1");
                return true;
            } catch (BusinessException exception) {
                assertEquals("TOO_MANY_REQUESTS", exception.getErrorCode().getCode());
                return false;
            }
        }).count();
        assertEquals(2, successes);
    }
}
