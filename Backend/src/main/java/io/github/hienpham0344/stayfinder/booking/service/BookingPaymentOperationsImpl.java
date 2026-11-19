package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingDetailRepository;
import io.github.hienpham0344.stayfinder.room.repository.RoomSnapshotRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomLookup;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.rewards.service.BookingRewards;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingPaymentOperationsImpl implements BookingPaymentOperations {
    private final BookingRepository repository;
    private final BookingPolicy policy;
    private final BookingRewards rewards;
    private final BookingDetailRepository details;
    private final RoomSnapshotRepository snapshots;
    private final RoomLookup rooms;
    public BookingPaymentOperationsImpl(BookingRepository repository, BookingPolicy policy, BookingRewards rewards,
                                        BookingDetailRepository details, RoomSnapshotRepository snapshots, RoomLookup rooms) {
        this.repository=repository; this.policy=policy; this.rewards=rewards;
        this.details=details; this.snapshots=snapshots; this.rooms=rooms;
    }
    @Transactional(readOnly=true) public Optional<BookingPaymentView> find(UUID id) { return repository.findById(id).map(this::view); }
    @Transactional public Optional<BookingPaymentView> findForUpdate(UUID id) {
        lockRooms(id);
        return repository.findForPaymentUpdate(id).map(this::view);
    }
    @Transactional(readOnly=true) public Optional<BookingPaymentView> findOwned(UUID id,UUID userId) { return repository.findByIdAndUserId(id,userId).map(this::view); }
    @Transactional public Optional<BookingPaymentView> findOwnedForUpdate(UUID id,UUID userId) {
        if (!repository.existsByIdAndUserId(id,userId)) return Optional.empty();
        lockRooms(id);
        return repository.findOwnedForPaymentUpdate(id,userId).map(this::view);
    }
    @Transactional public void confirm(UUID id) {
        lockRooms(id);
        Booking booking = repository.findForPaymentUpdate(id).orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus()==BookingStatus.CONFIRMED || booking.getStatus()==BookingStatus.COMPLETED) return;
        if (booking.getStatus()!=BookingStatus.PENDING || policy.expired(booking)) throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
        rewards.consume(id, booking.getVoucherId());
        // A voucher lock may have waited across the expiry boundary; validate again before confirming.
        if (policy.expired(booking)) throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
        booking.setStatus(BookingStatus.CONFIRMED); repository.save(booking);
    }
    private void lockRooms(UUID bookingId) {
        // Confirmation and booking creation serialize on the same physical room before touching a booking.
        // Without this, a confirmation started before expiry could commit after another booking reserved the room.
        var snapshotIds=details.findByBookingId(bookingId).stream().map(d -> d.getRoomSnapshotId()).toList();
        snapshots.findAllById(snapshotIds).stream().map(s -> s.getRoomId()).distinct().sorted()
                .forEach(id -> rooms.findBookingViewForUpdate(id).orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE)));
    }
    private BookingPaymentView view(Booking b) { return new BookingPaymentView(b.getId(),b.getUserId(),b.getTotalPrice(),b.getStatus(),policy.expiresAt(b)); }
}
