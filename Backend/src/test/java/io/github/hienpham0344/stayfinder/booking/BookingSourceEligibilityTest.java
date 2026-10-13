package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.booking.service.BookingDomainQueryService;
import io.github.hienpham0344.stayfinder.snapshot.entity.AccommodationSnapshot;
import io.github.hienpham0344.stayfinder.snapshot.repository.AccommodationSnapshotRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomAvailability;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookingSourceEligibilityTest {
 final BookingRepository bookings=mock(BookingRepository.class);
 final BookingDetailRepository details=mock(BookingDetailRepository.class);
 final AccommodationSnapshotRepository snapshots=mock(AccommodationSnapshotRepository.class);
 final RoomAvailability availability=mock(RoomAvailability.class);
 final BookingDomainQueryService service=new BookingDomainQueryService(bookings,details,snapshots,availability,Clock.systemUTC());
 final UUID user=UUID.randomUUID(),bookingId=UUID.randomUUID(),stay=UUID.randomUUID(),snapshotId=UUID.randomUUID();
 Booking completed(){
  Booking b=new Booking();b.setId(bookingId);b.setUserId(user);b.setStatus(BookingStatus.COMPLETED);b.setPaidAt(Instant.now());
  when(bookings.findByIdAndUserId(bookingId,user)).thenReturn(Optional.of(b));return b;
 }
 @Test void resolvesSnapshotPkToImmutableSourceForPaidCompletedOwnedBooking(){
  completed();BookingDetail d=new BookingDetail();d.setAccommodationSnapshotId(snapshotId);
  when(details.findByBookingId(bookingId)).thenReturn(List.of(d));
  AccommodationSnapshot snapshot=new AccommodationSnapshot();snapshot.setId(snapshotId);snapshot.setSourceAccommodationId(stay);
  when(snapshots.findAllById(Set.of(snapshotId))).thenReturn(List.of(snapshot));
  assertTrue(service.hasCompletedBookingForAccommodation(user,bookingId,stay));
  assertFalse(service.hasCompletedBookingForAccommodation(user,bookingId,snapshotId));
  snapshot.setAccommodationId(null);
  assertTrue(service.hasCompletedBookingForAccommodation(user,bookingId,stay));
 }
 @Test void completionWithoutVerifiedCollectionCannotAuthorizeAReview(){
  completed().setPaidAt(null);
  assertFalse(service.hasCompletedBookingForAccommodation(user,bookingId,stay));verifyNoInteractions(details,snapshots);
 }
 @Test void foreignBookingAndUnresolvedSourcesCannotAuthorizeAReview(){
  when(bookings.findByIdAndUserId(bookingId,user)).thenReturn(Optional.empty());
  assertFalse(service.hasCompletedBookingForAccommodation(user,bookingId,stay));
  completed();BookingDetail d=new BookingDetail();d.setAccommodationSnapshotId(snapshotId);
  when(details.findByBookingId(bookingId)).thenReturn(List.of(d));when(snapshots.findAllById(Set.of(snapshotId))).thenReturn(List.of());
  assertFalse(service.hasCompletedBookingForAccommodation(user,bookingId,stay));
 }
}
