package io.github.hienpham0344.stayfinder.booking.service;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.repository.BookingDetailRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;

@Service
public class BookingDomainQueryService implements RoomBookingAvailability, BookingEligibility {
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final AccommodationLookup accommodationLookup;

    public BookingDomainQueryService(BookingRepository bookingRepository,
                                     BookingDetailRepository bookingDetailRepository,
                                     AccommodationLookup accommodationLookup) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.accommodationLookup = accommodationLookup;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasOverlap(UUID roomId, LocalDate checkIn, LocalDate checkOut) {
        return !bookingDetailRepository.findOverlappingRoomBookings(
                roomId, checkIn, checkOut, List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED)).isEmpty();
    }

    @Override
    @Transactional(readOnly = true)
    public Set<UUID> overlappingRoomIds(Collection<UUID> roomIds, LocalDate checkIn, LocalDate checkOut) {
        if (roomIds.isEmpty()) return Set.of();
        return Set.copyOf(bookingDetailRepository.findOverlappingRoomIds(
                roomIds, checkIn, checkOut, List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED)));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasCompletedBookingForAccommodation(UUID userId, UUID bookingId, UUID accommodationId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .filter(item -> item.getStatus() == BookingStatus.COMPLETED)
                .orElse(null);
        return booking != null && bookingDetailRepository.findByBookingId(booking.getId()).stream()
                .anyMatch(detail -> detail.getAccommodationSnapshotId() != null
                        && accommodationLookup.snapshotBelongsToAccommodation(
                                detail.getAccommodationSnapshotId(), accommodationId));
    }
}
