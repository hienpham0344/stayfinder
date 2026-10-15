package io.github.hienpham0344.stayfinder.experience;
import io.github.hienpham0344.stayfinder.testsupport.*;import io.github.hienpham0344.stayfinder.booking.dto.*;import io.github.hienpham0344.stayfinder.booking.service.*;import io.github.hienpham0344.stayfinder.payment.service.PaymentService;import io.github.hienpham0344.stayfinder.demo.service.DemoPaymentOperationsService;
import io.github.hienpham0344.stayfinder.review.service.ReviewService;import io.github.hienpham0344.stayfinder.review.dto.*;
import io.github.hienpham0344.stayfinder.notification.service.NotificationService;import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.user.service.UserPreferencesService;import io.github.hienpham0344.stayfinder.user.dto.PreferencesRequest;import io.github.hienpham0344.stayfinder.support.service.SupportReportService;import io.github.hienpham0344.stayfinder.support.dto.SupportReportRequest;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;import io.github.hienpham0344.stayfinder.common.enums.UserRole;import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.*;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.test.context.ContextConfiguration;import org.springframework.context.annotation.Import;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.transaction.annotation.Transactional;import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.context.SecurityContextHolder;import org.springframework.security.core.authority.SimpleGrantedAuthority;import jakarta.persistence.EntityManager;import java.time.*;import java.util.*;import static org.junit.jupiter.api.Assertions.*;
@Tag("postgres") @SpringBootTest(properties="stayfinder.demo-operations.enabled=true") @ContextConfiguration(initializers=ApprovedPostgresInitializer.class) @Import(ApprovedPostgresContext.class) @Transactional
class ExperiencePostgresIntegrationTest{
 @Autowired JdbcTemplate j;@Autowired BookingQuoteService quotes;@Autowired BookingService bookings;@Autowired PaymentService payments;@Autowired DemoPaymentOperationsService demo;@Autowired CompletedStayService completed;@Autowired ReviewService reviews;@Autowired UserPreferencesService prefs;@Autowired SupportReportService reports;@Autowired NotificationService inbox;@Autowired DomainEventPublisher events;@Autowired MutableFixtureClock clock;@Autowired EntityManager em;
 @Autowired io.github.hienpham0344.stayfinder.media.service.MediaService media;
 UUID owner,other,admin,stay,room;
 @BeforeEach void fixture(){
  clock.reset();owner=UUID.randomUUID();other=UUID.randomUUID();admin=UUID.randomUUID();stay=UUID.randomUUID();room=UUID.randomUUID();
  for(UUID id:List.of(owner,other,admin))j.update("insert into users(id,email,full_name,role,credential_state) values(?,?,?,?,'active')",id,"fixture-"+id+"@example.test","Synthetic reviewer",id.equals(admin)?"admin":"customer");
  j.update("insert into accommodations(id,name,status,timezone,cleaning_fee_cents,service_fee_cents) values(?,'Synthetic experience stay','active','Asia/Ho_Chi_Minh',10000,3500)",stay);
  j.update("insert into room(id,accommodation_id,name,status,nightly_price_cents,max_guests_per_room,stock_total) values(?,?,'Synthetic experience tier','available',29900,2,1)",room,stay);
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new CurrentUser(admin,"fixture@example.test",UserRole.ADMIN),null,List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
 }
 @AfterEach void clear(){clock.reset();SecurityContextHolder.clearContext();}
 BookingResponse property(){var q=quotes.create(owner,new QuoteRequest(stay,room,LocalDate.of(2026,11,1),LocalDate.of(2026,11,4),1,1,0,null,0L));var b=bookings.create(owner,new CreateBookingRequest(q.id(),new GuestInformation("Synthetic guest","fixture@example.test","+84912345678",null),"pay_at_property"),"fixture-book");payments.create(owner,b.id(),"pay_at_property","fixture-payment");return b;}
 BookingResponse paidCompleted(){var b=property();demo.settleAtProperty(admin,b.id(),"fixture-settle");clock.set(Instant.parse("2026-11-04T04:00:00Z"));assertTrue(completed.completeEligible(b.id(),clock.instant()));return bookings.get(owner,b.id());}
 @Test void persistedReviewUsesOwnedCompletedSourceAndUpdatesSummaryAndBookingAction(){
  var b=paidCompleted();assertTrue(b.allowedActions().review());assertThrows(BusinessException.class,()->reviews.create(other,stay,new CreateReviewRequest(b.id(),4,"Foreign",List.of())));
  var r=reviews.create(owner,stay,new CreateReviewRequest(b.id(),4,"Synthetic review",List.of()));em.flush();assertTrue(r.isMine());assertEquals("Synthetic reviewer",r.userName());
  assertFalse(bookings.get(owner,b.id()).allowedActions().review(),"Already reviewed booking must not offer another review");
  assertEquals(1,reviews.summary(stay).count());assertEquals(4.0,reviews.summary(stay).average());assertEquals(1L,reviews.summary(stay).byStar().get("4"));
  assertFalse(reviews.list(stay,4,PageRequest.of(0,20),other).items().getFirst().isMine());
  assertThrows(BusinessException.class,()->reviews.create(owner,stay,new CreateReviewRequest(b.id(),5,"Duplicate",List.of())));
  assertThrows(BusinessException.class,()->reviews.update(other,r.id(),new UpdateReviewRequest(1,"Foreign",List.of())));
  reviews.update(owner,r.id(),new UpdateReviewRequest(5,"Edited",List.of()));em.flush();assertEquals(5.0,reviews.summary(stay).average());
  reviews.delete(owner,r.id());em.flush();assertEquals(0,reviews.summary(stay).count());assertNull(reviews.summary(stay).average());assertTrue(bookings.get(owner,b.id()).allowedActions().review());
 }

 @Test void ownedMediaAttachmentSurvivesEditDetachesOnDeleteAndRejectsForeignUpload(){
  var b=paidCompleted();byte[] png=new byte[]{(byte)137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1};
  var photo=media.upload(owner,new org.springframework.mock.web.MockMultipartFile("image","fixture.png","image/png",png));
  var foreign=media.upload(other,new org.springframework.mock.web.MockMultipartFile("image","fixture.png","image/png",png));
  var r=reviews.create(owner,stay,new CreateReviewRequest(b.id(),4,"With photo",List.of(photo.id())));em.flush();
  assertEquals(1,r.imageUrls().size());assertEquals(r.id(),j.queryForObject("select review_id from media_assets where id=?",UUID.class,photo.id()));
  assertThrows(BusinessException.class,()->reviews.update(owner,r.id(),new UpdateReviewRequest(5,"Foreign upload",List.of(foreign.id()))));
  assertEquals(r.id(),j.queryForObject("select review_id from media_assets where id=?",UUID.class,photo.id()));
  assertThrows(BusinessException.class,()->media.deleteUnattached(owner,photo.id()));
  reviews.update(owner,r.id(),new UpdateReviewRequest(5,"Keep photo",List.of(photo.id())));em.flush();assertEquals(1,reviews.list(stay,null,PageRequest.of(0,20),owner).items().getFirst().imageUrls().size());
  reviews.delete(owner,r.id());em.flush();assertNull(j.queryForObject("select review_id from media_assets where id=?",UUID.class,photo.id()));assertNotNull(j.queryForObject("select unattached_since from media_assets where id=?",java.sql.Timestamp.class,photo.id()));
  media.deleteUnattached(owner,photo.id());em.flush();assertEquals(0,j.queryForObject("select count(*) from media_assets where id=?",Integer.class,photo.id()));
 }

 @Test void preferencesAndReportsPersistOnlyForOwnerWithReplayResult(){
  assertEquals("en-US",prefs.get(owner).language());assertEquals(0,j.queryForObject("select count(*) from user_preferences where user_id=?",Integer.class,owner));
  prefs.patch(owner,new PreferencesRequest("vi-VN",false));em.flush();em.clear();assertEquals("vi-VN",prefs.get(owner).language());assertFalse(prefs.get(owner).bookingNotifications());assertTrue(prefs.get(other).bookingNotifications());
  var b=property();assertThrows(BusinessException.class,()->reports.submit(other,new SupportReportRequest("Payment","Synthetic issue",b.id()),"fixture-report"));
  var request=new SupportReportRequest("Payment","Synthetic issue",b.id());var result=reports.submit(owner,request,"fixture-report");em.flush();em.clear();
  assertEquals(result.reportId(),reports.submit(owner,request,"fixture-report").reportId());assertEquals("submitted",result.status());assertEquals(1,j.queryForObject("select count(*) from support_reports where user_id=?",Integer.class,owner));
 }
 @Test void lateDeliveryAtSameClockStaysUnreadAfterReadAllAndReplayMaterializesOnce(){
  UUID source=UUID.randomUUID();events.publish("reward_claimed",owner,source,clock.instant());em.flush();assertEquals(1,inbox.materializeBatch());em.flush();
  var first=inbox.list(owner,false,PageRequest.of(0,20));assertEquals(1,first.totalElements());assertEquals(1,inbox.unreadCount(owner));assertEquals(0,inbox.unreadCount(other));
  events.publish("reward_earned",owner,UUID.randomUUID(),clock.instant());em.flush();assertEquals(1,inbox.materializeBatch());em.flush();assertEquals(0,inbox.materializeBatch());
  var result=inbox.markAllRead(owner,first.snapshotTime());assertEquals(1,result.updated());assertEquals(1,result.unreadCount());var remaining=inbox.list(owner,true,PageRequest.of(0,20)).items().getFirst();assertTrue(remaining.createdAt().isAfter(first.snapshotTime()));
  assertThrows(BusinessException.class,()->inbox.markRead(other,remaining.id()));inbox.markRead(owner,remaining.id());em.flush();assertEquals(0,inbox.unreadCount(owner));
  assertThrows(BusinessException.class,()->inbox.markAllRead(owner,clock.instant().plusSeconds(60)));
  prefs.patch(owner,new PreferencesRequest(null,false));var b=property();em.flush();assertEquals(0,inbox.materializeBatch());em.flush();
  assertEquals(1,j.queryForObject("select count(*) from outbox_events where user_id=? and event_type='booking_created' and materialization_status='suppressed'",Integer.class,owner));
 }
}
