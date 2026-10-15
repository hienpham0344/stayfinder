package io.github.hienpham0344.stayfinder.room;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomAvailabilityService;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import io.github.hienpham0344.stayfinder.snapshot.dto.SnapshotSourceView;
import io.github.hienpham0344.stayfinder.common.enums.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class RoomRemainingInventoryTest {
 @Test void usesSourceRoomAndDailyPeakInsteadOfSnapshotPkOrWholeTripSum(){
  var rooms=mock(RoomRepository.class);var sources=mock(SnapshotSourceQueryRepository.class);
  UUID roomId=UUID.randomUUID(),stayId=UUID.randomUUID();Room room=new Room();room.setId(roomId);room.setAccommodationId(stayId);
  room.setStockTotal(3);room.setStatus(RoomStatus.AVAILABLE);
  LocalDate in=LocalDate.of(2026,11,1),out=in.plusDays(3);Instant now=Instant.parse("2026-10-13T12:00:00Z");
  when(rooms.findById(roomId)).thenReturn(Optional.of(room));
  when(sources.findOverlaps(stayId,List.of(roomId),in,out,now)).thenReturn(List.of(
   new SnapshotSourceView(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),roomId,stayId,in,in.plusDays(1),2,BookingStatus.CONFIRMED,null),
   new SnapshotSourceView(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),roomId,stayId,in.plusDays(1),out,2,BookingStatus.CONFIRMED,null),
   new SnapshotSourceView(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),roomId,stayId,in,out,1,BookingStatus.PENDING,now)));
  assertEquals(1,new RoomAvailabilityService(rooms,sources).remaining(roomId,in,out,now));
 }
}
