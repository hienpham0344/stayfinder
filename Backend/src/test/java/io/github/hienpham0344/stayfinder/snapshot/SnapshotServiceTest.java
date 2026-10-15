package io.github.hienpham0344.stayfinder.snapshot;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.snapshot.entity.*;
import io.github.hienpham0344.stayfinder.snapshot.repository.*;
import io.github.hienpham0344.stayfinder.snapshot.service.SnapshotService;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SnapshotServiceTest {
 final RoomRepository rooms=mock(RoomRepository.class);
 final AccommodationRepository stays=mock(AccommodationRepository.class);
 final RoomSnapshotRepository roomSnapshots=mock(RoomSnapshotRepository.class);
 final AccommodationSnapshotRepository staySnapshots=mock(AccommodationSnapshotRepository.class);
 final SnapshotService service=new SnapshotService(rooms,stays,roomSnapshots,staySnapshots,Clock.systemUTC());
 @Test void capturesSeparateSnapshotIdentitiesAndSourceMetadataThatSurviveLiveMutation(){
  UUID roomId=UUID.randomUUID(),stayId=UUID.randomUUID();
  Room room=new Room();room.setId(roomId);room.setAccommodationId(stayId);room.setName("Deluxe");room.setStatus(RoomStatus.AVAILABLE);
  room.setDescription("Window");room.setNightlyPriceCents(29900L);room.setMaxGuestsPerRoom(2);
  room.setImageUrls(new String[]{"https://example.test/room.jpg"});
  Accommodation stay=new Accommodation();stay.setId(stayId);stay.setName("Riverside");stay.setAddress("Road");
  stay.setStatus(AccommodationStatus.ACTIVE);stay.setTimezone("Asia/Bangkok");stay.setCleaningFeeCents(10000L);stay.setServiceFeeCents(3500L);
  when(rooms.findById(roomId)).thenReturn(Optional.of(room));when(stays.findById(stayId)).thenReturn(Optional.of(stay));
  var refs=service.capture(roomId,stayId);
  var roomCaptor=ArgumentCaptor.forClass(RoomSnapshot.class);verify(roomSnapshots).save(roomCaptor.capture());
  var stayCaptor=ArgumentCaptor.forClass(AccommodationSnapshot.class);verify(staySnapshots).save(stayCaptor.capture());
  assertNotEquals(roomId,refs.roomSnapshotId());assertNotEquals(stayId,refs.accommodationSnapshotId());
  assertEquals(roomId,roomCaptor.getValue().getSourceRoomId());assertEquals(stayId,stayCaptor.getValue().getSourceAccommodationId());
  room.setName("Changed");room.getImageUrls()[0]="https://example.test/changed.jpg";stay.setTimezone("UTC");
  assertEquals("Deluxe",roomCaptor.getValue().getName());assertEquals(29900,roomCaptor.getValue().getNightlyPriceCents());
  assertEquals("https://example.test/room.jpg",roomCaptor.getValue().getImageUrls()[0]);
  assertEquals("Asia/Bangkok",stayCaptor.getValue().getTimezone());assertEquals(10000,stayCaptor.getValue().getCleaningFeeCents());
 }
 @Test void refusesMismatchedSourceAccommodationBeforeWritingAnySnapshot(){
  UUID roomId=UUID.randomUUID(),stayId=UUID.randomUUID();Room room=new Room();room.setAccommodationId(UUID.randomUUID());
  when(rooms.findById(roomId)).thenReturn(Optional.of(room));
  assertThrows(BusinessException.class,()->service.capture(roomId,stayId));verifyNoInteractions(roomSnapshots,staySnapshots);
 }
}
