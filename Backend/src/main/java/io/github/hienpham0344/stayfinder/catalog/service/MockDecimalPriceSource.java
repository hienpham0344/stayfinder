package io.github.hienpham0344.stayfinder.catalog.service;

import io.github.hienpham0344.stayfinder.catalog.dto.RawDemoOffer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

/** Fictional source with decimal-dollar fields, deliberately different from the seed schema. */
@Component
public class MockDecimalPriceSource implements PriceOfferSource {
    private final boolean enabled;
    private final Clock clock;
    public MockDecimalPriceSource(@Value("${stayfinder.catalog.mock-sources-enabled:false}") boolean enabled, Clock clock) {
        this.enabled = enabled;
        this.clock = clock;
    }
    public record Payload(String brand, BigDecimal nightlyUsd, BigDecimal cleaningUsd,
                          BigDecimal serviceUsd, boolean refundable) {}
    public RawDemoOffer normalize(UUID accommodationId, UUID roomId, Payload value) {
        return new RawDemoOffer(accommodationId, roomId, value.brand(), cents(value.nightlyUsd()), "USD", true,
            cents(value.cleaningUsd()), cents(value.serviceUsd()),
            value.refundable() ? "free_before_checkin" : "non_refundable", clock.instant());
    }
    private static long cents(BigDecimal amount) {
        if (amount == null || amount.signum() < 0) throw new IllegalArgumentException("Invalid mock money");
        // Never silently round provider prices or overflow integer cents.
        return amount.movePointRight(2).longValueExact();
    }
    @Override public List<RawDemoOffer> find(UUID accommodationId, UUID roomId) {
        if (!enabled) return List.of();
        return List.of(normalize(accommodationId, roomId,
            new Payload("Mock Decimal Stay", new BigDecimal("95.00"), new BigDecimal("20.00"), new BigDecimal("15.00"), true)));
    }
}
