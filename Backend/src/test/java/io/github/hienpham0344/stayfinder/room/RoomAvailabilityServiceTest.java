package io.github.hienpham0344.stayfinder.room;

import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.mapper.RoomMapper;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomServiceImpl;
import io.github.hienpham0344.stayfinder.booking.service.RoomBookingAvailability;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RoomAvailabilityServiceTest {
    private final RoomRepository roomRepository = mock(RoomRepository.class);
    private final RoomBookingAvailability roomBookingAvailability = mock(RoomBookingAvailability.class);
    private final RoomServiceImpl service = new RoomServiceImpl(roomRepository, roomBookingAvailability,
            Mappers.getMapper(RoomMapper.class));

    @Test
    void rejectsAClosedDateRangeBeforeQueryingRepositories() {
        assertThrows(BusinessException.class, () -> service.listAvailable(UUID.randomUUID(),
                LocalDate.of(2026, 10, 2), LocalDate.of(2026, 10, 2), 1));
    }

    @Test
    void excludesRoomsWithPendingOrConfirmedOverlaps() {
        UUID accommodationId = UUID.randomUUID();
        Room free = room(UUID.randomUUID(), accommodationId, "Free");
        Room occupied = room(UUID.randomUUID(), accommodationId, "Occupied");
        when(roomRepository.findByAccommodationIdAndStatus(accommodationId, RoomStatus.AVAILABLE))
                .thenReturn(List.of(free, occupied));
        when(roomBookingAvailability.hasOverlap(eq(free.getId()), any(), any())).thenReturn(false);
        when(roomBookingAvailability.hasOverlap(eq(occupied.getId()), any(), any())).thenReturn(true);

        List<RoomResponse> result = service.listAvailable(accommodationId,
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 4), 2);

        assertEquals(List.of("Free"), result.stream().map(RoomResponse::name).toList());
    }

    private Room room(UUID id, UUID accommodationId, String name) {
        Room room = new Room();
        room.setId(id);
        room.setAccommodationId(accommodationId);
        room.setName(name);
        room.setStatus(RoomStatus.AVAILABLE);
        return room;
    }
}
