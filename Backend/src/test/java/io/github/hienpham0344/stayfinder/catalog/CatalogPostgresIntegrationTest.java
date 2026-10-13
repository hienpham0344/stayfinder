package io.github.hienpham0344.stayfinder.catalog;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationSearchRepository;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationSearchRequest;
import io.github.hienpham0344.stayfinder.testsupport.PostgresTestTarget;
import org.junit.jupiter.api.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@Tag("postgres")
class CatalogPostgresIntegrationTest {
 @Test void searchAndFavoritesUseClassifiedUsdAndDailyRemainingStock() throws Exception {
  try(var c=PostgresTestTarget.openRollbackOnly()){
   try{
    var j=new JdbcTemplate(new SingleConnectionDataSource(c,true));
    UUID user=UUID.randomUUID(),other=UUID.randomUUID(),location=UUID.randomUUID(),stay=UUID.randomUUID(),room=UUID.randomUUID();
    Instant now=Instant.parse("2026-10-13T12:00:00Z");LocalDate in=LocalDate.of(2026,11,1),out=in.plusDays(3);
    for(UUID id:List.of(user,other))j.update("insert into users(id,email,role) values(?,?,'customer')",id,"fixture-"+id+"@example.test");
    j.update("insert into locations(id,city,country) values(?,'Synthetic city','Synthetic country')",location);
    j.update("insert into accommodations(id,name,status,location_id,timezone,cleaning_fee_cents,service_fee_cents) values(?,'Synthetic stay','active',?,'Asia/Ho_Chi_Minh',1000,500)",stay,location);
    j.update("insert into room(id,accommodation_id,name,status,nightly_price_cents,max_guests_per_room,stock_total) values(?,?,'Synthetic tier','available',29900,2,1)",room,stay);
    var repo=new AccommodationSearchRepository(new NamedParameterJdbcTemplate(j));
    var req=new AccommodationSearchRequest();req.setLocationId(location);req.setCheckIn(in);req.setCheckOut(out);
    var cards=repo.search(req,PageRequest.of(0,10),null,now);
    assertEquals(1,cards.totalElements());assertEquals(29900,cards.items().getFirst().nightlyPrice().amountCents());assertFalse(cards.items().getFirst().isFavorite());
    assertNull(cards.items().getFirst().ratingAverage());
    UUID reviewBooking=UUID.randomUUID();
    j.update("insert into bookings(id,user_id,status,payment_status) values(?,?,'completed','success')",reviewBooking,user);
    j.update("insert into reviews(id,user_id,booking_id,accommodation_id,rating,comment,created_at,updated_at) values(?,?,?,?,4,'Synthetic review',?,?)",UUID.randomUUID(),user,reviewBooking,stay,java.sql.Timestamp.from(now),java.sql.Timestamp.from(now));
    assertEquals(4.0,repo.findCard(stay,null,now).orElseThrow().ratingAverage());
    UUID favorite=UUID.randomUUID();j.update("insert into favorites(id,user_id,accommodation_id) values(?,?,?)",favorite,user,stay);
    assertTrue(repo.findCard(stay,user,now).orElseThrow().isFavorite());
    assertEquals(1,repo.favorites(PageRequest.of(0,10),user,now).totalElements());
    assertEquals(0,repo.favorites(PageRequest.of(0,10),other,now).totalElements());
    UUID rs=UUID.randomUUID(),acs=UUID.randomUUID(),booking=UUID.randomUUID();
    j.update("insert into room_snapshot(id,room_id,source_room_id) values(?,?,?)",rs,room,room);
    j.update("insert into accommodation_snapshot(id,accommodation_id,source_accommodation_id) values(?,?,?)",acs,stay,stay);
    j.update("insert into bookings(id,user_id,status,hold_expires_at) values(?,?,'pending',?)",booking,user,java.sql.Timestamp.from(now.plusSeconds(900)));
    j.update("insert into booking_details(id,booking_id,room_snapshot_id,accommodation_snapshot_id,check_in_date,check_out_date,quantity) values(?,?,?,?,?,?,1)",UUID.randomUUID(),booking,rs,acs,java.sql.Date.valueOf(in),java.sql.Date.valueOf(out));
    assertEquals(0,repo.search(req,PageRequest.of(0,10),user,now).totalElements());
    req.setCheckIn(out);req.setCheckOut(out.plusDays(1));assertEquals(1,repo.search(req,PageRequest.of(0,10),user,now).totalElements());
    req.setCheckIn(in);req.setCheckOut(out);j.update("update bookings set hold_expires_at=? where id=?",java.sql.Timestamp.from(now),booking);
    assertEquals(1,repo.search(req,PageRequest.of(0,10),user,now).totalElements());
   }finally{c.rollback();}
  }
 }
}
