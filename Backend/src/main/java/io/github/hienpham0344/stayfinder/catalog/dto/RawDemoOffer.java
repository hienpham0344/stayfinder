package io.github.hienpham0344.stayfinder.catalog.dto;
import java.time.Instant;
import java.util.UUID;
public record RawDemoOffer(UUID accommodationId,UUID roomId,String providerName,Long nightlyPriceCents,String currency,
        boolean includesFees,Long cleaningFeeCents,Long serviceFeeCents,String cancellationCode,Instant observedAt) {}
