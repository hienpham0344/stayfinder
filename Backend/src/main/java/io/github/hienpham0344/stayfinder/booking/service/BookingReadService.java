package io.github.hienpham0344.stayfinder.booking.service;
import io.github.hienpham0344.stayfinder.booking.repository.*;
import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.mapper.BookingMapper;
import io.github.hienpham0344.stayfinder.snapshot.repository.*;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service
public class BookingReadService {
 private final BookingRepository bookings;private final BookingDetailRepository details;private final BookingQuoteRepository quotes;
 private final RoomSnapshotRepository rooms;private final AccommodationSnapshotRepository stays;private final BookingMapper mapper;private final Clock clock;
 public BookingReadService(BookingRepository bookings,BookingDetailRepository details,BookingQuoteRepository quotes,RoomSnapshotRepository rooms,
  AccommodationSnapshotRepository stays,BookingMapper mapper,Clock clock){
  this.bookings=bookings;this.details=details;this.quotes=quotes;this.rooms=rooms;this.stays=stays;this.mapper=mapper;this.clock=clock;
 }
 @Transactional(readOnly=true) public BookingResponse owned(UUID userId,UUID id){
  return response(bookings.findByIdAndUserId(id,userId).orElseThrow(()->new BusinessException(ErrorCode.BOOKING_NOT_FOUND)));
 }
 public BookingResponse response(Booking booking){
  if(booking.getQuoteId()==null||booking.getTotalPriceCents()==null)throw unavailable();
  var q=quotes.findById(booking.getQuoteId()).filter(x->booking.getUserId().equals(x.getUserId())).orElseThrow(BookingReadService::unavailable);
  var ds=details.findByBookingId(booking.getId());if(ds.size()!=1)throw unavailable();var d=ds.getFirst();
  var room=rooms.findById(d.getRoomSnapshotId()).orElseThrow(BookingReadService::unavailable);
  var stay=stays.findById(d.getAccommodationSnapshotId()).orElseThrow(BookingReadService::unavailable);
  if(!q.getRoomId().equals(room.getSourceRoomId())||!q.getAccommodationId().equals(stay.getSourceAccommodationId())
   ||q.getTotalCents()!=booking.getTotalPriceCents())throw unavailable();
  String image=stay.getImageUrl();
  if(image==null&&room.getImageUrls()!=null&&room.getImageUrls().length>0)image=room.getImageUrls()[0];
  boolean active=booking.getStatus()==BookingStatus.PENDING||booking.getStatus()==BookingStatus.CONFIRMED;
  boolean beforeCheckIn=clock.instant().isBefore(q.getCheckIn().atTime(14,0).atZone(ZoneId.of(q.getTimezone())).toInstant());
  boolean timedOut=booking.getStatus()==BookingStatus.PENDING&&booking.getHoldExpiresAt()!=null&&!clock.instant().isBefore(booking.getHoldExpiresAt());
  return new BookingResponse(booking.getId(),booking.getConfirmationCode(),booking.getStatus().getValue(),booking.getCancellationReason(),
   booking.getCreatedAt(),booking.getHoldExpiresAt(),booking.getPaymentMethod(),q.getAccommodationId(),q.getRoomId(),stay.getName(),room.getName(),image,
   q.getCheckIn(),q.getCheckOut(),q.getTimezone(),q.getQuantity(),q.getAdults(),q.getChildren(),BookingQuoteService.response(q),mapper.toGuest(booking),
   booking.getPaymentStatus(),booking.getRefundStatus(),new BookingResponse.AllowedActions(active&&beforeCheckIn&&!timedOut,
    booking.getStatus()==BookingStatus.COMPLETED&&booking.getPaidAt()!=null,true));
 }
 private static BusinessException unavailable(){return new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
}
