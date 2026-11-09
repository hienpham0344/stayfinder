package io.github.hienpham0344.stayfinder.catalog;

import io.github.hienpham0344.stayfinder.catalog.service.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.Clock;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class MockPriceSourceTest {
    private final UUID stay = UUID.randomUUID(), room = UUID.randomUUID();
    @Test void adaptersPreserveDistinctFeeSemantics() {
        var decimal = new MockDecimalPriceSource(true, Clock.systemUTC()).find(stay,room).getFirst();
        var minor = new MockMinorUnitPriceSource(true, Clock.systemUTC()).find(stay,room).getFirst();
        assertEquals(9500L,decimal.nightlyPriceCents());
        assertEquals(2000L,decimal.cleaningFeeCents());
        assertTrue(decimal.includesFees());
        assertFalse(minor.includesFees());
        assertNull(minor.cleaningFeeCents());
        assertEquals(room,minor.roomId());
    }
    @Test void disabledSourcesDoNotInventOffers() {
        assertTrue(new MockDecimalPriceSource(false,Clock.systemUTC()).find(stay,room).isEmpty());
        assertTrue(new MockMinorUnitPriceSource(false,Clock.systemUTC()).find(stay,room).isEmpty());
    }
    @Test void decimalAdapterRejectsFractionsOfCentsAndNegativeMoney() {
        var source=new MockDecimalPriceSource(true,Clock.systemUTC());
        assertThrows(ArithmeticException.class,()->source.normalize(stay,room,
            new MockDecimalPriceSource.Payload("Mock",new BigDecimal("1.001"),BigDecimal.ZERO,BigDecimal.ZERO,true)));
        assertThrows(IllegalArgumentException.class,()->source.normalize(stay,room,
            new MockDecimalPriceSource.Payload("Mock",new BigDecimal("-1"),BigDecimal.ZERO,BigDecimal.ZERO,true)));
    }
    @Test void minorAdapterRejectsCurrencyMismatch() {
        assertThrows(IllegalArgumentException.class,()->new MockMinorUnitPriceSource(true,Clock.systemUTC()).normalize(stay,room,
            new MockMinorUnitPriceSource.Payload("Mock",new MockMinorUnitPriceSource.Rate(100,"VND"),"flexible")));
    }
}
