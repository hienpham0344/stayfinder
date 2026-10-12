package io.github.hienpham0344.stayfinder.catalog;
import io.github.hienpham0344.stayfinder.catalog.service.TripPriceCalculator;
import io.github.hienpham0344.stayfinder.common.dto.*;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.validation.SelectionPolicy;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class CatalogPolicyTest {
    private final Clock clock=Clock.fixed(Instant.parse("2026-10-13T00:30:00Z"),ZoneOffset.UTC);
    private QuoteSelection selected(LocalDate date,int quantity,int adults,int children) {
        return new QuoteSelection(UUID.randomUUID(),UUID.randomUUID(),date,date.plusDays(2),quantity,adults,children);
    }
    @Test void checkInUsesTheAccommodationsLocalDate() {
        var yesterdayUtc=selected(LocalDate.of(2026,10,12),1,1,0);
        assertThrows(BusinessException.class,()->SelectionPolicy.validate(yesterdayUtc,ZoneId.of("Asia/Bangkok"),clock));
        assertDoesNotThrow(()->SelectionPolicy.validate(yesterdayUtc,ZoneId.of("America/Los_Angeles"),clock));
    }
    @Test void rejectsOutOfBoundsSelectionWithoutRoomLookup() {
        assertThrows(BusinessException.class,()->SelectionPolicy.validate(selected(LocalDate.of(2026,11,1),11,1,0),ZoneOffset.UTC,clock));
        assertThrows(BusinessException.class,()->SelectionPolicy.validate(selected(LocalDate.of(2026,11,1),1,1,21),ZoneOffset.UTC,clock));
    }
    @Test void fullTripUsdTotalIncludesRoomQuantityAndOncePerBookingFees() {
        assertEquals(new MoneyUsd(182900,"USD"),TripPriceCalculator.total(29900,2,3,2500,1000));
    }
    @Test void rejectsUnsafeMoneyAndInvalidNightsRatherThanRoundingOrOverflowing() {
        assertThrows(BusinessException.class,()->TripPriceCalculator.total(9_007_199_254_740_991L,90,10,0,0));
        assertThrows(BusinessException.class,()->TripPriceCalculator.total(100,0,1,0,0));
    }
}
