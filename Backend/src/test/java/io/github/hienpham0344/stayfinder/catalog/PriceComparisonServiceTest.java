package io.github.hienpham0344.stayfinder.catalog;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.catalog.dto.*;
import io.github.hienpham0344.stayfinder.catalog.repository.DemoPriceOfferRepository;
import io.github.hienpham0344.stayfinder.catalog.service.PriceComparisonService;
import io.github.hienpham0344.stayfinder.common.dto.*;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.room.dto.*;
import io.github.hienpham0344.stayfinder.room.service.RoomService;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PriceComparisonServiceTest {
    private final AccommodationRepository accommodations=mock(AccommodationRepository.class);
    private final RoomService rooms=mock(RoomService.class);
    private final DemoPriceOfferRepository offers=mock(DemoPriceOfferRepository.class);
    private final Clock clock=Clock.fixed(Instant.parse("2026-10-13T00:00:00Z"),ZoneOffset.UTC);
    private final PriceComparisonService service=new PriceComparisonService(accommodations,rooms,offers,clock);
    private final UUID id=UUID.randomUUID(),roomId=UUID.randomUUID();
    private final QuoteSelection selection=new QuoteSelection(id,roomId,LocalDate.of(2026,11,1),LocalDate.of(2026,11,3),2,3,1);
    @BeforeEach void setup() {
        Accommodation stay=new Accommodation();stay.setId(id);stay.setStatus(AccommodationStatus.ACTIVE);stay.setTimezone("Asia/Bangkok");
        stay.setCleaningFeeCents(2500L);stay.setServiceFeeCents(1000L);when(accommodations.findById(id)).thenReturn(Optional.of(stay));
        when(rooms.available(eq(id),any(),any(),eq(3),eq(1),eq(2))).thenReturn(List.of(new RoomResponse(roomId,id,"Standard",null,
            MoneyUsd.cents(29900),null,null,2,3,3,false,List.of(),new CancellationPolicyResponse(true,"14:00","Asia/Bangkok"))));
        when(offers.find(id,roomId)).thenReturn(List.of());
    }
    private RawDemoOffer offer(String name,long nightly,String currency,boolean fees,String cancellation) {
        return new RawDemoOffer(id,roomId,name,nightly,currency,fees,2500L,1000L,cancellation,clock.instant().minusSeconds(60));
    }
    @Test void ownOfferUsesTheSelectedTierAndFullTripQuantityFees() {
        var result=service.compare(id,selection);assertEquals(1,result.offers().size());
        assertEquals(123100,result.offers().getFirst().total().amountCents());
        assertEquals("USD",result.offers().getFirst().total().currency());assertTrue(result.offers().getFirst().isDemo());
        assertEquals(selection.checkIn(),result.checkIn());assertEquals(2,result.quantity());
    }
    @Test void bestValueExcludesUnmatchedCurrencyFeesAndCancellation() {
        when(offers.find(id,roomId)).thenReturn(List.of(offer("Cheap before fees",100,"USD",false,"free_before_checkin"),
            offer("Nonrefundable",200,"USD",true,"non_refundable"),offer("Currency mismatch",100,"VND",true,"free_before_checkin"),
            offer("Comparable",28000,"USD",true,"free_before_checkin")));
        var result=service.compare(id,selection);
        assertEquals(4,result.offers().size());assertTrue(result.offers().stream().allMatch(PriceComparisonOffer::isDemo));
        assertEquals(List.of("Comparable"),result.offers().stream().filter(PriceComparisonOffer::isBestValue).map(PriceComparisonOffer::providerName).toList());
    }
    @Test void unavailableOrWrongSourceRoomCannotBeCompared() {
        when(rooms.available(eq(id),any(),any(),anyInt(),anyInt(),anyInt())).thenReturn(List.of());
        assertThrows(BusinessException.class,()->service.compare(id,selection));
        assertThrows(BusinessException.class,()->service.compare(UUID.randomUUID(),selection));
    }
}
