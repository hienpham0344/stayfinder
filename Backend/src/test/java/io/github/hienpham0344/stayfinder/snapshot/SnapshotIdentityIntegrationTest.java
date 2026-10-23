package io.github.hienpham0344.stayfinder.snapshot;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import io.github.hienpham0344.stayfinder.room.service.RoomInventoryPolicy;
import io.github.hienpham0344.stayfinder.testsupport.PostgresTestTarget;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@Tag("postgres")
class SnapshotIdentityIntegrationTest {
 @Test void realPostgresQueryResolvesDifferentSnapshotIdsAndIgnoresExpiredHalfOpenHolds() throws Exception {
  try(var connection=PostgresTestTarget.openRollbackOnly()){
   try{
    var jdbc=new JdbcTemplate(new SingleConnectionDataSource(connection,true));
    UUID user=UUID.randomUUID(),stay=UUID.randomUUID(),room=UUID.randomUUID(),rs=UUID.randomUUID(),acs=UUID.randomUUID(),booking=UUID.randomUUID();
    LocalDate in=LocalDate.of(2026,11,1),out=in.plusDays(3);Instant now=Instant.parse("2026-10-13T12:00:00Z");
    jdbc.update("insert into users(id,email,role) values(?,?,?)",user,"fixture-"+user+"@example.test","customer");
    jdbc.update("insert into accommodations(id,name,status) values(?,?,?)",stay,"Synthetic source stay","active");
    jdbc.update("insert into room(id,accommodation_id,name,status) values(?,?,?,?)",room,stay,"Synthetic source room","available");
    jdbc.update("insert into room_snapshot(id,room_id,source_room_id) values(?,?,?)",rs,room,room);
    jdbc.update("insert into accommodation_snapshot(id,accommodation_id,source_accommodation_id) values(?,?,?)",acs,stay,stay);
    jdbc.update("insert into bookings(id,user_id,status,hold_expires_at) values(?,?,?,?)",booking,user,"pending",java.sql.Timestamp.from(now.plusSeconds(900)));
    jdbc.update("insert into booking_details(id,booking_id,room_snapshot_id,accommodation_snapshot_id,check_in_date,check_out_date,quantity) values(?,?,?,?,?,?,?)",
      UUID.randomUUID(),booking,rs,acs,java.sql.Date.valueOf(in),java.sql.Date.valueOf(out),1);
    var sources=new SnapshotSourceQueryRepository(new NamedParameterJdbcTemplate(jdbc));
    var rows=sources.findOverlaps(stay,List.of(room),in,out,now);
    assertEquals(1,rows.size());assertNotEquals(room,rows.getFirst().roomSnapshotId());
    assertEquals(room,rows.getFirst().sourceRoomId());assertEquals(stay,rows.getFirst().sourceAccommodationId());
    assertEquals(2,RoomInventoryPolicy.available(3,rows,room,stay,in,out,now));
    assertTrue(sources.findOverlaps(stay,List.of(room),out,out.plusDays(1),now).isEmpty());
    jdbc.update("update bookings set hold_expires_at=? where id=?",java.sql.Timestamp.from(now),booking);
    assertTrue(sources.findOverlaps(stay,List.of(room),in,out,now).isEmpty());
   }finally{connection.rollback();}
  }
 }
}
