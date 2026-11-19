package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.rewards.service.BookingRewards;
import io.github.hienpham0344.stayfinder.room.entity.RoomSnapshot;
import io.github.hienpham0344.stayfinder.room.repository.RoomSnapshotRepository;
import io.github.hienpham0344.stayfinder.room.service.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class BookingPaymentLockTest {
    private final BookingRepository bookings=mock(BookingRepository.class);
    private final BookingDetailRepository details=mock(BookingDetailRepository.class);
    private final RoomSnapshotRepository snapshots=mock(RoomSnapshotRepository.class);
    private final RoomLookup rooms=mock(RoomLookup.class);
    private final BookingRewards rewards=mock(BookingRewards.class);
    @Test void confirmationLocksPhysicalRoomBeforeBooking() {
        Instant now=Instant.parse("2030-06-01T00:00:00Z");Booking b=booking(now.plusSeconds(900));
        BookingDetail d=new BookingDetail();d.setRoomSnapshotId(UUID.randomUUID());RoomSnapshot s=new RoomSnapshot();s.setRoomId(UUID.randomUUID());
        when(details.findByBookingId(b.getId())).thenReturn(List.of(d));when(snapshots.findAllById(List.of(d.getRoomSnapshotId()))).thenReturn(List.of(s));
        when(rooms.findBookingViewForUpdate(s.getRoomId())).thenReturn(Optional.of(new RoomBookingView(s.getRoomId(),UUID.randomUUID(),BigDecimal.ONE,RoomStatus.AVAILABLE)));
        service(Clock.fixed(now,ZoneOffset.UTC)).confirm(b.getId());
        var order=inOrder(rooms,bookings,rewards);order.verify(rooms).findBookingViewForUpdate(s.getRoomId());order.verify(bookings).findForPaymentUpdate(b.getId());
        order.verify(rewards).consume(b.getId(),b.getVoucherId());assertEquals(BookingStatus.CONFIRMED,b.getStatus());
    }
    @Test void expiryIsRecheckedAfterWaitingForVoucherLock() {
        Instant expiry=Instant.parse("2030-06-01T00:15:00Z");Booking b=booking(expiry);Clock clock=mock(Clock.class);
        when(clock.instant()).thenReturn(expiry.minusSeconds(1),expiry);
        assertThrows(BusinessException.class,() -> service(clock).confirm(b.getId()));
        verify(rewards).consume(b.getId(),b.getVoucherId());assertEquals(BookingStatus.PENDING,b.getStatus());verify(bookings,never()).save(any());
    }
    @Test void foreignBookingDoesNotAcquireItsRoomLocks() {
        UUID id=UUID.randomUUID(),owner=UUID.randomUUID();
        assertTrue(service(Clock.systemUTC()).findOwnedForUpdate(id,owner).isEmpty());verifyNoInteractions(details,snapshots,rooms);
    }
    private Booking booking(Instant expiry) {
        Booking b=new Booking();b.setId(UUID.randomUUID());b.setUserId(UUID.randomUUID());b.setVoucherId(UUID.randomUUID());b.setExpiresAt(expiry);b.setStatus(BookingStatus.PENDING);
        when(bookings.findForPaymentUpdate(b.getId())).thenReturn(Optional.of(b));return b;
    }
    private BookingPaymentOperationsImpl service(Clock clock) {
        return new BookingPaymentOperationsImpl(bookings,new BookingPolicy(clock,15,"Asia/Ho_Chi_Minh","12:00"),rewards,details,snapshots,rooms);
    }
}
