package io.github.hienpham0344.stayfinder.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Duration;
import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    Ticker publicCacheTicker() { return Ticker.systemTicker(); }

    @Bean
    CacheManager cacheManager(@Value("${stayfinder.cache.enabled:true}") boolean enabled,
                              @Value("${stayfinder.cache.detail-ttl-seconds:60}") long ttl,
                              @Value("${stayfinder.cache.detail-max-size:2000}") long size, Ticker ticker) {
        if (!enabled) return new NoOpCacheManager();
        if (ttl < 1 || size < 1) throw new IllegalArgumentException("Invalid cache limits");
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                new CaffeineCache("accommodation-detail", Caffeine.newBuilder().maximumSize(size)
                        .expireAfterWrite(Duration.ofSeconds(ttl)).ticker(ticker).recordStats().build()),
                new CaffeineCache("catalog-metadata", Caffeine.newBuilder().maximumSize(100)
                        .expireAfterWrite(Duration.ofMinutes(10)).ticker(ticker).recordStats().build())));
        return manager;
    }
}
