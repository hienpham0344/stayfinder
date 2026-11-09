package io.github.hienpham0344.stayfinder.catalog.service;

import io.github.hienpham0344.stayfinder.catalog.dto.RawDemoOffer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

/** Fictional provider whose nested rate excludes fees. It cannot win a fee-inclusive comparison. */
@Component
public class MockMinorUnitPriceSource implements PriceOfferSource {
    private final boolean enabled;
    private final Clock clock;
    public record Rate(long amount, String currency) {}
    public record Payload(String supplier, Rate rate, String cancellation) {}
    public MockMinorUnitPriceSource(@Value("${stayfinder.catalog.mock-sources-enabled:false}") boolean enabled, Clock clock) {
        this.enabled = enabled;
        this.clock = clock;
    }
    public RawDemoOffer normalize(UUID accommodationId, UUID roomId, Payload value) {
        if (value.rate() == null || value.rate().amount() < 0 || !"USD".equals(value.rate().currency()))
            throw new IllegalArgumentException("Unsupported mock rate");
        return new RawDemoOffer(accommodationId, roomId, value.supplier(), value.rate().amount(), "USD", false,
            null, null, "flexible".equals(value.cancellation()) ? "free_before_checkin" : "non_refundable", clock.instant());
    }
    @Override public List<RawDemoOffer> find(UUID accommodationId, UUID roomId) {
        return enabled ? List.of(normalize(accommodationId, roomId,
            new Payload("Mock Minor Stay", new Rate(9000, "USD"), "flexible"))) : List.of();
    }
}
