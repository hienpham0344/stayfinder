package io.github.hienpham0344.stayfinder.booking;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationBookingView;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.booking.dto.CreateBookingRequest;
import io.github.hienpham0344.stayfinder.booking.mapper.BookingMapper;
import io.github.hienpham0344.stayfinder.booking.repository.BookingDetailRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingServiceImpl;
import io.github.hienpham0344.stayfinder.booking.service.RoomBookingAvailability;
import io.github.hienpham0344.stayfinder.room.service.RoomBookingView;
import io.github.hienpham0344.stayfinder.room.service.RoomLookup;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class BookingServiceTest {
    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final BookingDetailRepository bookingDetailRepository = mock(BookingDetailRepository.class);
    private final AccommodationLookup accommodationLookup = mock(AccommodationLookup.class);
    private final RoomLookup roomLookup = mock(RoomLookup.class);
    private final RoomBookingAvailability roomBookingAvailability = mock(RoomBookingAvailability.class);
    private final BookingServiceImpl service = new BookingServiceImpl(bookingRepository, bookingDetailRepository,
            accommodationLookup, roomLookup, roomBookingAvailability, Mappers.getMapper(BookingMapper.class));

    @Test
    void refusesToCreateAbookingWhenTheLiveSchemaCannotStoreRoomIdentity() {
        UUID accommodationId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        when(accommodationLookup.findBookingView(accommodationId))
                .thenReturn(Optional.of(new AccommodationBookingView(accommodationId, null)));
        when(roomLookup.findBookingView(roomId)).thenReturn(Optional.of(new RoomBookingView(
                roomId, accommodationId, BigDecimal.valueOf(100), RoomStatus.AVAILABLE)));
        when(roomBookingAvailability.hasOverlap(any(), any(), any())).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class, () -> service.create(new CreateBookingRequest(
                accommodationId, roomId, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 3), 1, 2)));

        assertEquals("BOOKING_SNAPSHOT_REQUIRED", exception.getErrorCode().getCode());
        verify(bookingRepository, never()).save(any());
    }
}
