package io.github.hienpham0344.stayfinder.config;

import org.junit.jupiter.api.Test;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import java.util.concurrent.atomic.AtomicLong;
import static org.junit.jupiter.api.Assertions.*;

class PublicCacheTest {
    @Test
    void cacheExpiresAndIsBoundedWithoutSleeping() {
        AtomicLong time = new AtomicLong();
        var manager = (SimpleCacheManager) new CacheConfig().cacheManager(true, 60, 2, time::get);
        manager.initializeCaches();
        var cache = (CaffeineCache) manager.getCache("accommodation-detail");
        assertNotNull(cache);
        cache.put("one", "first");
        assertEquals("first", cache.get("one", String.class));
        time.set(java.time.Duration.ofSeconds(60).toNanos());
        assertNull(cache.get("one"));
        for (int i = 0; i < 10; i++) cache.put(i, i);
        cache.getNativeCache().cleanUp();
        assertTrue(cache.getNativeCache().estimatedSize() <= 2);
    }
    @Test
    void disabledCacheDoesNotKeepValues() {
        var cache = new CacheConfig().cacheManager(false, 60, 2000, () -> 0).getCache("accommodation-detail");
        assertNotNull(cache);
        cache.put("one", "value");
        assertNull(cache.get("one"));
    }
}
