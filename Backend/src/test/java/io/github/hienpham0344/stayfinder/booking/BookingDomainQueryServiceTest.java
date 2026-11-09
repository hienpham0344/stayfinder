package io.github.hienpham0344.stayfinder.booking;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import io.github.hienpham0344.stayfinder.booking.repository.BookingDetailRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingDomainQueryService;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class BookingDomainQueryServiceTest {
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final BookingDetailRepository details = mock(BookingDetailRepository.class);
    private final AccommodationLookup accommodations = mock(AccommodationLookup.class);
    private final BookingDomainQueryService service = new BookingDomainQueryService(bookings, details, accommodations);

    @Test
    void completedBookingMatchesAccommodationThroughItsSnapshot() {
        UUID userId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();
        UUID accommodationId = UUID.randomUUID();
        UUID snapshotId = UUID.randomUUID();
        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setStatus(BookingStatus.COMPLETED);
        BookingDetail detail = new BookingDetail();
        detail.setAccommodationSnapshotId(snapshotId);
        when(bookings.findByIdAndUserId(bookingId, userId)).thenReturn(Optional.of(booking));
        when(details.findByBookingId(bookingId)).thenReturn(List.of(detail));
        when(accommodations.snapshotBelongsToAccommodation(snapshotId, accommodationId)).thenReturn(true);

        assertTrue(service.hasCompletedBookingForAccommodation(userId, bookingId, accommodationId));
    }
}
