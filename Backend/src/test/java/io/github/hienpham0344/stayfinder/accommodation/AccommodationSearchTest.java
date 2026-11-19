package io.github.hienpham0344.stayfinder.accommodation;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationSearch;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class AccommodationSearchTest {
    private final Clock clock = Clock.fixed(Instant.parse("2027-01-01T00:00:00Z"), ZoneOffset.UTC);
    @Test
    void rejectsPartialDatesPastDatesAndInvalidPriceIntervals() {
        assertThrows(BusinessException.class, () -> filter(LocalDate.of(2027, 2, 1), null, null, null).validate(clock));
        assertThrows(BusinessException.class, () -> filter(LocalDate.of(2026, 12, 31), LocalDate.of(2027, 1, 2), null, null).validate(clock));
        assertThrows(BusinessException.class, () -> filter(null, null, BigDecimal.TEN, BigDecimal.ONE).validate(clock));
        assertDoesNotThrow(() -> filter(LocalDate.of(2027, 2, 1), LocalDate.of(2027, 2, 3), BigDecimal.ONE, BigDecimal.TEN).validate(clock));
    }
    private AccommodationSearch filter(LocalDate in, LocalDate out, BigDecimal min, BigDecimal max) {
        return new AccommodationSearch("Hà Nội", null, List.of(), min, max, in, out, 2);
    }
}
