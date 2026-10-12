package io.github.hienpham0344.stayfinder.accommodation;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationSearchRequest;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class AccommodationSearchTest {
    @Test void rejectsUnpairedReversedAndOver90NightDates() {
        var request=new AccommodationSearchRequest();request.setCheckIn(LocalDate.of(2026,11,1));
        assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setCheckOut(request.getCheckIn());assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setCheckOut(request.getCheckIn().plusDays(91));assertThrows(BusinessException.class,request::validateAndNormalize);
    }
    @Test void rejectsInvalidPriceAndGuestRanges() {
        var request=new AccommodationSearchRequest();request.setMinPriceCents(200L);request.setMaxPriceCents(100L);
        assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setMinPriceCents(-1L);assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setMinPriceCents(0L);request.setMaxPriceCents(9_007_199_254_740_992L);
        assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setMaxPriceCents(null);request.setAdults(0);assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setAdults(1);request.setChildren(21);assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setChildren(0);request.setRooms(11);assertThrows(BusinessException.class,request::validateAndNormalize);
    }
    @Test void rejectsOversizedSelectorsOutOfRangeRatingAndSqlLikeSortInjection() {
        var request=new AccommodationSearchRequest();request.setTypeIds(Collections.nCopies(21,UUID.randomUUID()));
        assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setTypeIds(List.of());request.setMinRating(new BigDecimal("5.1"));
        assertThrows(BusinessException.class,request::validateAndNormalize);
        request.setMinRating(null);request.setSort("name;drop table users");
        assertThrows(BusinessException.class,request::validateAndNormalize);
    }
    @Test void normalizesLegacyPriceAliasAndCopiesAllSelectedAmenities() {
        var request=new AccommodationSearchRequest();UUID first=UUID.randomUUID(),second=UUID.randomUUID();
        request.setAmenityIds(new ArrayList<>(List.of(first,second,first)));
        request.setQ("  Da Nang  ");request.setSort("basePrice");request.setDirection("DESC");
        request.validateAndNormalize();
        assertEquals("Da Nang",request.getQ());assertEquals("price",request.getSort());assertEquals("desc",request.getDirection());
        assertEquals(List.of(first,second),request.getAmenityIds());
        assertThrows(UnsupportedOperationException.class,()->request.getAmenityIds().add(UUID.randomUUID()));
    }
}
