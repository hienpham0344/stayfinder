package io.github.hienpham0344.stayfinder.booking;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationBookingView;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationSnapshot;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationSnapshotRepository;
import io.github.hienpham0344.stayfinder.booking.dto.CreateBookingRequest;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import io.github.hienpham0344.stayfinder.booking.mapper.BookingMapper;
import io.github.hienpham0344.stayfinder.booking.repository.BookingDetailRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingServiceImpl;
import io.github.hienpham0344.stayfinder.booking.service.RoomBookingAvailability;
import io.github.hienpham0344.stayfinder.room.service.RoomBookingView;
import io.github.hienpham0344.stayfinder.room.service.RoomLookup;
import io.github.hienpham0344.stayfinder.room.entity.RoomSnapshot;
import io.github.hienpham0344.stayfinder.room.repository.RoomSnapshotRepository;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

class BookingServiceTest {
    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final BookingDetailRepository bookingDetailRepository = mock(BookingDetailRepository.class);
    private final AccommodationSnapshotRepository accommodationSnapshotRepository = mock(AccommodationSnapshotRepository.class);
    private final RoomSnapshotRepository roomSnapshotRepository = mock(RoomSnapshotRepository.class);
    private final AccommodationLookup accommodationLookup = mock(AccommodationLookup.class);
    private final RoomLookup roomLookup = mock(RoomLookup.class);
    private final RoomBookingAvailability roomBookingAvailability = mock(RoomBookingAvailability.class);
    private final BookingServiceImpl service = new BookingServiceImpl(bookingRepository, bookingDetailRepository,
            accommodationSnapshotRepository, roomSnapshotRepository,
            accommodationLookup, roomLookup, roomBookingAvailability, Mappers.getMapper(BookingMapper.class));

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void refusesMultipleUnitsUntilInventoryCapacityIsModelled() {
        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.create(new CreateBookingRequest(UUID.randomUUID(), UUID.randomUUID(),
                        LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), 2, 2)));

        assertEquals("VALIDATION_ERROR", exception.getErrorCode().getCode());
        verifyNoInteractions(bookingRepository, roomLookup);
    }

    @Test
    void refusesPastCheckInDate() {
        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.create(new CreateBookingRequest(UUID.randomUUID(), UUID.randomUUID(),
                        LocalDate.now().minusDays(1), LocalDate.now().plusDays(1), 1, 1)));

        assertEquals("VALIDATION_ERROR", exception.getErrorCode().getCode());
        verifyNoInteractions(bookingRepository, roomLookup);
    }

    @Test
    void refusesZeroPriceRoomBeforeWritingSnapshots() {
        UUID accommodationId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        when(accommodationLookup.findBookingView(accommodationId))
                .thenReturn(Optional.of(new AccommodationBookingView(accommodationId, null)));
        when(roomLookup.findBookingViewForUpdate(roomId)).thenReturn(Optional.of(new RoomBookingView(
                roomId, accommodationId, BigDecimal.ZERO, RoomStatus.AVAILABLE)));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.create(new CreateBookingRequest(accommodationId, roomId,
                        LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), 1, 1)));

        assertEquals("ROOM_NOT_AVAILABLE", exception.getErrorCode().getCode());
        verifyNoInteractions(accommodationSnapshotRepository, roomSnapshotRepository, bookingRepository);
    }

    @Test
    void refusesFractionalVndPriceThatSepayCannotTransferExactly() {
        UUID accommodationId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        when(accommodationLookup.findBookingView(accommodationId))
                .thenReturn(Optional.of(new AccommodationBookingView(accommodationId, null)));
        when(roomLookup.findBookingViewForUpdate(roomId)).thenReturn(Optional.of(new RoomBookingView(
                roomId, accommodationId, new BigDecimal("100.50"), RoomStatus.AVAILABLE)));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.create(new CreateBookingRequest(accommodationId, roomId,
                        LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), 1, 1)));

        assertEquals("ROOM_NOT_AVAILABLE", exception.getErrorCode().getCode());
        verifyNoInteractions(accommodationSnapshotRepository, roomSnapshotRepository, bookingRepository);
    }

    @Test
    void refusesCancellationOfConfirmedBookingWithoutRefundFlow() {
        UUID userId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new io.github.hienpham0344.stayfinder.security.CurrentUser(userId, "user@example.com",
                        io.github.hienpham0344.stayfinder.common.enums.UserRole.CUSTOMER), null, List.of()));
        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setUserId(userId);
        booking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findOwnedForPaymentUpdate(bookingId, userId)).thenReturn(Optional.of(booking));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.cancel(bookingId));

        assertEquals("BOOKING_INVALID_STATE", exception.getErrorCode().getCode());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void loadsDetailsForBookingPageInOneRepositoryCall() {
        UUID userId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new io.github.hienpham0344.stayfinder.security.CurrentUser(userId, "user@example.com",
                        io.github.hienpham0344.stayfinder.common.enums.UserRole.CUSTOMER), null, List.of()));
        Booking first = new Booking();
        first.setId(UUID.randomUUID());
        first.setUserId(userId);
        Booking second = new Booking();
        second.setId(UUID.randomUUID());
        second.setUserId(userId);
        PageRequest page = PageRequest.of(0, 20);
        when(bookingRepository.findByUserId(userId, page)).thenReturn(new PageImpl<>(List.of(first, second), page, 2));
        when(bookingDetailRepository.findByBookingIdIn(any())).thenReturn(List.of());

        assertEquals(2, service.list(page).getTotalElements());
        verify(bookingDetailRepository).findByBookingIdIn(List.of(first.getId(), second.getId()));
        verify(bookingDetailRepository, never()).findByBookingId(any());
    }

    @Test
    void bookingPageIncludesOriginalStayAndRoomFromSnapshots() {
        UUID userId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new io.github.hienpham0344.stayfinder.security.CurrentUser(userId, "user@example.com",
                        io.github.hienpham0344.stayfinder.common.enums.UserRole.CUSTOMER), null, List.of()));
        Booking booking = new Booking();
        booking.setId(UUID.randomUUID());
        booking.setUserId(userId);
        BookingDetail detail = new BookingDetail();
        detail.setId(UUID.randomUUID());
        detail.setBookingId(booking.getId());
        detail.setAccommodationSnapshotId(UUID.randomUUID());
        detail.setRoomSnapshotId(UUID.randomUUID());
        AccommodationSnapshot accommodation = new AccommodationSnapshot();
        accommodation.setId(detail.getAccommodationSnapshotId());
        accommodation.setAccommodationId(UUID.randomUUID());
        accommodation.setName("Original stay");
        RoomSnapshot room = new RoomSnapshot();
        room.setId(detail.getRoomSnapshotId());
        room.setRoomId(UUID.randomUUID());
        room.setName("Original room");
        PageRequest page = PageRequest.of(0, 20);
        when(bookingRepository.findByUserId(userId, page)).thenReturn(new PageImpl<>(List.of(booking), page, 1));
        when(bookingDetailRepository.findByBookingIdIn(List.of(booking.getId()))).thenReturn(List.of(detail));
        when(accommodationSnapshotRepository.findAllById(any())).thenReturn(List.of(accommodation));
        when(roomSnapshotRepository.findAllById(any())).thenReturn(List.of(room));

        var response = service.list(page).getContent().get(0).details().get(0);

        assertEquals(accommodation.getAccommodationId(), response.accommodationId());
        assertEquals("Original stay", response.accommodationName());
        assertEquals(room.getRoomId(), response.roomId());
        assertEquals("Original room", response.roomName());
        verify(accommodationSnapshotRepository).findAllById(any());
        verify(roomSnapshotRepository).findAllById(any());
    }

    @Test
    void createsBookingWithRoomSnapshotAndServerCalculatedPrice() {
        UUID accommodationId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new io.github.hienpham0344.stayfinder.security.CurrentUser(userId, "user@example.com",
                        io.github.hienpham0344.stayfinder.common.enums.UserRole.CUSTOMER), null, List.of()));
        when(accommodationLookup.findBookingView(accommodationId))
                .thenReturn(Optional.of(new AccommodationBookingView(accommodationId, null)));
        when(roomLookup.findBookingViewForUpdate(roomId)).thenReturn(Optional.of(new RoomBookingView(
                roomId, accommodationId, BigDecimal.valueOf(100), RoomStatus.AVAILABLE)));
        when(roomBookingAvailability.hasOverlap(any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(UUID.randomUUID());
            return booking;
        });
        when(bookingDetailRepository.save(any(BookingDetail.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingDetailRepository.findByBookingId(any())).thenReturn(List.of());
        when(accommodationSnapshotRepository.save(any(AccommodationSnapshot.class))).thenAnswer(invocation -> {
            AccommodationSnapshot snapshot = invocation.getArgument(0);
            snapshot.setId(UUID.randomUUID());
            return snapshot;
        });
        when(roomSnapshotRepository.save(any(RoomSnapshot.class))).thenAnswer(invocation -> {
            RoomSnapshot snapshot = invocation.getArgument(0);
            snapshot.setId(UUID.randomUUID());
            return snapshot;
        });

        service.create(new CreateBookingRequest(accommodationId, roomId,
                LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 1, 2));

        org.mockito.ArgumentCaptor<Booking> bookingCaptor = org.mockito.ArgumentCaptor.forClass(Booking.class);
        org.mockito.ArgumentCaptor<BookingDetail> detailCaptor = org.mockito.ArgumentCaptor.forClass(BookingDetail.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        verify(bookingDetailRepository).save(detailCaptor.capture());
        assertEquals(userId, bookingCaptor.getValue().getUserId());
        assertEquals(new BigDecimal("200"), bookingCaptor.getValue().getTotalPrice());
        assertEquals(bookingCaptor.getValue().getId(), detailCaptor.getValue().getBookingId());
        assertNotNull(detailCaptor.getValue().getRoomSnapshotId());
        assertNotNull(detailCaptor.getValue().getAccommodationSnapshotId());
    }
}
