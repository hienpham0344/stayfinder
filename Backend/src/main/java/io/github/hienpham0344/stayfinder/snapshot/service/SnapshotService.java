package io.github.hienpham0344.stayfinder.snapshot.service;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.snapshot.repository.*;
import io.github.hienpham0344.stayfinder.snapshot.entity.*;
import io.github.hienpham0344.stayfinder.booking.service.BookingQuoteService;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
@Service
public class SnapshotService {
 public record SnapshotReferences(UUID roomSnapshotId,UUID accommodationSnapshotId){}
 private final RoomRepository rooms;private final AccommodationRepository stays;
 private final RoomSnapshotRepository roomSnapshots;private final AccommodationSnapshotRepository staySnapshots;private final Clock clock;
 public SnapshotService(RoomRepository rooms,AccommodationRepository stays,RoomSnapshotRepository roomSnapshots,
                        AccommodationSnapshotRepository staySnapshots,Clock clock){
  this.rooms=rooms;this.stays=stays;this.roomSnapshots=roomSnapshots;this.staySnapshots=staySnapshots;this.clock=clock;
 }
 @Transactional(propagation=Propagation.MANDATORY)
 public SnapshotReferences capture(UUID roomId,UUID accommodationId){
  var room=rooms.findById(roomId).filter(r->r.getStatus()==RoomStatus.AVAILABLE&&accommodationId.equals(r.getAccommodationId()))
    .orElseThrow(()->new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE));
  var stay=stays.findById(accommodationId).filter(a->a.getStatus()==AccommodationStatus.ACTIVE)
    .orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
  BookingQuoteService.validateSellablePricing(room,stay);BookingQuoteService.timezone(stay);
  Instant now=clock.instant();
  RoomSnapshot rs=new RoomSnapshot();rs.setId(UUID.randomUUID());rs.setRoomId(roomId);rs.setSourceRoomId(roomId);
  rs.setName(room.getName());rs.setDescription(room.getDescription());rs.setNightlyPriceCents(room.getNightlyPriceCents());
  rs.setPrice(BigDecimal.valueOf(room.getNightlyPriceCents(),2));rs.setCurrency("USD");
  rs.setMaxGuestsPerRoom(room.getMaxGuestsPerRoom());rs.setSizeSqm(room.getSizeSqm());rs.setBedType(room.getBedType());
  rs.setIncludesBreakfast(room.getIncludesBreakfast());rs.setImageUrls(room.getImageUrls()==null?new String[0]:room.getImageUrls().clone());
  rs.setCapturedAt(now);
  AccommodationSnapshot as=new AccommodationSnapshot();as.setId(UUID.randomUUID());as.setAccommodationId(accommodationId);
  as.setSourceAccommodationId(accommodationId);as.setName(stay.getName());as.setAddress(stay.getAddress());
  as.setTimezone(stay.getTimezone());as.setCleaningFeeCents(stay.getCleaningFeeCents());as.setServiceFeeCents(stay.getServiceFeeCents());as.setCapturedAt(now);
  staySnapshots.save(as);roomSnapshots.save(rs);
  return new SnapshotReferences(rs.getId(),as.getId());
 }
}
