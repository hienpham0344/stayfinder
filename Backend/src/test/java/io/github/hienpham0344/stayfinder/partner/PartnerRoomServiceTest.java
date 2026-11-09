package io.github.hienpham0344.stayfinder.partner;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomDetails;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomOffer;
import io.github.hienpham0344.stayfinder.partner.service.PartnerRoomService;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.mapper.RoomMapper;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.repository.RoomTypeRepository;
import io.github.hienpham0344.stayfinder.snapshot.dto.SnapshotSourceView;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PartnerRoomServiceTest {
    private final UUID owner = UUID.randomUUID();
    private final UUID stayId = UUID.randomUUID();
    private final UUID roomId = UUID.randomUUID();
    private final AccommodationRepository accommodations = mock(AccommodationRepository.class);
    private final RoomRepository rooms = mock(RoomRepository.class);
    private final SnapshotSourceQueryRepository bookings = mock(SnapshotSourceQueryRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-01T12:00:00Z"), ZoneOffset.UTC);
    private final PartnerRoomService service = new PartnerRoomService(accommodations, rooms,
            mock(RoomTypeRepository.class), bookings, Mappers.getMapper(RoomMapper.class), clock);

    @Test
    void roomOutsideOwnersAccommodationCannotBeUpdated() {
        when(rooms.lockOwned(roomId, stayId, owner)).thenReturn(Optional.empty());

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.updateOffer(owner, stayId, roomId, new PartnerRoomOffer(12000L, RoomStatus.AVAILABLE)));

        assertEquals(ErrorCode.ROOM_NOT_FOUND, error.getErrorCode());
        verifyNoInteractions(accommodations, bookings);
    }

    @Test
    void offerUpdateChangesCatalogPriceWithoutOverwritingHistoricalPrice() {
        Room room = ownedRoom();
        room.setPrice(new BigDecimal("123.45"));

        var result = service.updateOffer(owner, stayId, roomId, new PartnerRoomOffer(12000L, RoomStatus.MAINTENANCE));

        assertEquals(new BigDecimal("123.45"), room.getPrice());
        assertEquals(12000L, result.nightlyPriceCents());
        assertEquals(RoomStatus.MAINTENANCE, result.status());
        verifyNoInteractions(bookings);
    }

    @Test
    void reducingStockWithAnActiveReservationIsRejected() {
        Room room = ownedRoom();
        room.setStockTotal(3);
        room.setMaxGuestsPerRoom(2);
        when(bookings.findOverlaps(eq(stayId), eq(List.of(roomId)), eq(LocalDate.of(2026, 9, 30)),
                any(), eq(clock.instant()))).thenReturn(List.of(mock(SnapshotSourceView.class)));

        var details = new PartnerRoomDetails(null, "Double room", null, 2, 1, null, null, false, List.of());
        BusinessException error = assertThrows(BusinessException.class,
                () -> service.updateDetails(owner, stayId, roomId, details));

        assertEquals(ErrorCode.ROOM_CAPACITY_RESERVED, error.getErrorCode());
        assertEquals(3, room.getStockTotal());
    }

    private Room ownedRoom() {
        Room room = new Room();
        room.setId(roomId);
        room.setAccommodationId(stayId);
        when(rooms.lockOwned(roomId, stayId, owner)).thenReturn(Optional.of(room));
        when(accommodations.lockOwned(stayId, owner)).thenReturn(Optional.of(new Accommodation()));
        return room;
    }
}
