package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.snapshot.repository.AccommodationSnapshotRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomAvailability;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
@Service
public class BookingDomainQueryService implements RoomBookingAvailability,BookingEligibility {
 private final BookingRepository bookings;private final BookingDetailRepository details;
 private final AccommodationSnapshotRepository snapshots;private final RoomAvailability inventory;private final Clock clock;
 public BookingDomainQueryService(BookingRepository bookings,BookingDetailRepository details,AccommodationSnapshotRepository snapshots,
                                 RoomAvailability inventory,Clock clock){
  this.bookings=bookings;this.details=details;this.snapshots=snapshots;this.inventory=inventory;this.clock=clock;
 }
 @Override @Transactional(readOnly=true)
 public boolean hasOverlap(UUID roomId,LocalDate checkIn,LocalDate checkOut){
  return inventory.remaining(roomId,checkIn,checkOut,clock.instant())==0;
 }
 @Override @Transactional(readOnly=true)
 public boolean hasCompletedBookingForAccommodation(UUID userId,UUID bookingId,UUID accommodationId){
  var booking=bookings.findByIdAndUserId(bookingId,userId)
    .filter(b->b.getStatus()==BookingStatus.COMPLETED&&b.getPaidAt()!=null).orElse(null);
  if(booking==null)return false;
  var snapshotIds=details.findByBookingId(bookingId).stream().map(d->d.getAccommodationSnapshotId())
    .filter(Objects::nonNull).collect(Collectors.toSet());
  if(snapshotIds.isEmpty())return false;
  return snapshots.findAllById(snapshotIds).stream().anyMatch(s->accommodationId.equals(s.getSourceAccommodationId()));
 }
}
