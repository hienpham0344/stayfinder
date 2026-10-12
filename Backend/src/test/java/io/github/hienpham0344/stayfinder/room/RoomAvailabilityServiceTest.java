package io.github.hienpham0344.stayfinder.room;

import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.mapper.RoomMapper;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomServiceImpl;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.snapshot.dto.SnapshotSourceView;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RoomAvailabilityServiceTest {
    private final RoomRepository rooms=mock(RoomRepository.class);
    private final AccommodationRepository accommodations=mock(AccommodationRepository.class);
    private final SnapshotSourceQueryRepository sources=mock(SnapshotSourceQueryRepository.class);
    private final Clock clock=Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC);
    private final RoomServiceImpl service=new RoomServiceImpl(rooms,accommodations,sources,Mappers.getMapper(RoomMapper.class),clock);
    private final UUID id=UUID.randomUUID();
    private final LocalDate start=LocalDate.of(2026,11,1),end=start.plusDays(3);
    @BeforeEach void setup() {
        Accommodation accommodation=new Accommodation();accommodation.setId(id);accommodation.setStatus(AccommodationStatus.ACTIVE);
        accommodation.setTimezone("Asia/Bangkok");when(accommodations.findById(id)).thenReturn(Optional.of(accommodation));
        when(sources.findOverlaps(eq(id),anyCollection(),any(),any(),any())).thenReturn(List.of());
    }
    private Room room(String name,int stock,int capacity) {
        Room r=new Room();r.setId(UUID.randomUUID());r.setAccommodationId(id);r.setName(name);r.setStatus(RoomStatus.AVAILABLE);
        r.setStockTotal(stock);r.setMaxGuestsPerRoom(capacity);r.setNightlyPriceCents(29900L);r.setIncludesBreakfast(false);return r;
    }
    @Test void rejectsAClosedDateRangeBeforeQueryingInventory() {
        assertThrows(BusinessException.class,()->service.available(id,start,start,1,0,1));
        verifyNoInteractions(sources);
    }
    @Test void returnsSourceMappedAvailabilityAndUsdPriceForAnAvailableTier() {
        Room tier=room("Standard",3,2);
        var reservation=new SnapshotSourceView(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),tier.getId(),id,start,end,2,BookingStatus.CONFIRMED,null);
        when(rooms.findByAccommodationIdAndStatus(id,RoomStatus.AVAILABLE)).thenReturn(List.of(tier));
        when(sources.findOverlaps(eq(id),anyCollection(),any(),any(),any())).thenReturn(List.of(reservation));
        var result=assertDoesNotThrow(()->service.available(id,start,end,1,0,1));
        assertEquals(1,result.size());assertEquals(1,result.getFirst().availableCount());
        assertEquals(29900,result.getFirst().nightlyPrice().amountCents());assertEquals("USD",result.getFirst().nightlyPrice().currency());
        assertEquals("Asia/Bangkok",result.getFirst().cancellationPolicy().timezone());
    }
    @Test void capacityIncludesAdultsChildrenAndSelectedRoomQuantity() {
        Room tier=room("Standard",3,2);when(rooms.findByAccommodationIdAndStatus(id,RoomStatus.AVAILABLE)).thenReturn(List.of(tier));
        assertTrue(service.available(id,start,end,3,0,1).isEmpty());
        assertTrue(service.available(id,start,end,1,2,1).isEmpty());
        assertEquals(1,service.available(id,start,end,3,1,2).size());
    }
    @Test void unknownUsdPriceAndInsufficientStockCannotBeSold() {
        Room unknown=room("Unknown",3,4);unknown.setNightlyPriceCents(null);
        Room scarce=room("Scarce",1,4);
        when(rooms.findByAccommodationIdAndStatus(id,RoomStatus.AVAILABLE)).thenReturn(List.of(unknown,scarce));
        assertTrue(service.available(id,start,end,2,0,2).isEmpty());
    }
    @Test void expiredPendingHoldDoesNotBlockReturnedTier() {
        Room tier=room("Standard",1,2);
        when(rooms.findByAccommodationIdAndStatus(id,RoomStatus.AVAILABLE)).thenReturn(List.of(tier));
        when(sources.findOverlaps(eq(id),anyCollection(),any(),any(),any())).thenReturn(List.of(
            new SnapshotSourceView(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),tier.getId(),id,start,end,1,BookingStatus.PENDING,clock.instant())));
        assertEquals(1,service.available(id,start,end,2,0,1).size());
    }
}
