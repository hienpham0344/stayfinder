package io.github.hienpham0344.stayfinder.catalog.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import java.time.Instant;
public record PriceComparisonOffer(String providerName,MoneyUsd total,MoneyUsd nightlyPrice,boolean includesFees,
        String cancellationDescription,Instant observedAt,boolean isDemo,boolean isBestValue) {}
