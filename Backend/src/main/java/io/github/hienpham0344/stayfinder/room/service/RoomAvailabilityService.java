package io.github.hienpham0344.stayfinder.room.service;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service
public class RoomAvailabilityService implements RoomAvailability {
 private final RoomRepository rooms;private final SnapshotSourceQueryRepository sources;
 public RoomAvailabilityService(RoomRepository rooms,SnapshotSourceQueryRepository sources){this.rooms=rooms;this.sources=sources;}
 @Override @Transactional(readOnly=true)
 public int remaining(UUID roomId,LocalDate checkIn,LocalDate checkOut,Instant now){
  var room=rooms.findById(roomId).orElse(null);
  if(room==null||room.getStatus()!=RoomStatus.AVAILABLE||room.getStockTotal()==null||room.getAccommodationId()==null)return 0;
  return RoomInventoryPolicy.available(room.getStockTotal(),
    sources.findOverlaps(room.getAccommodationId(),List.of(roomId),checkIn,checkOut,now),roomId,room.getAccommodationId(),checkIn,checkOut,now);
 }
}
