package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.testsupport.*;import io.github.hienpham0344.stayfinder.booking.dto.*;import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.payment.service.*;import io.github.hienpham0344.stayfinder.demo.service.DemoPaymentOperationsService;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.*;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.test.context.ContextConfiguration;import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.transaction.annotation.Transactional;import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.context.SecurityContextHolder;import org.springframework.security.core.authority.SimpleGrantedAuthority;
import jakarta.persistence.EntityManager;import java.time.*;import java.util.*;import static org.junit.jupiter.api.Assertions.*;
@Tag("postgres") @SpringBootTest(properties="stayfinder.demo-operations.enabled=true")
@ContextConfiguration(initializers=ApprovedPostgresInitializer.class) @Import(ApprovedPostgresContext.class) @Transactional
class CompletedStayRefundPostgresIntegrationTest {
 @Autowired JdbcTemplate j;@Autowired BookingQuoteService quotes;@Autowired BookingService bookings;@Autowired BookingLifecycleService lifecycle;@Autowired PaymentService payments;
 @Autowired DemoPaymentOperationsService demo;@Autowired CompletedStayService completed;@Autowired BookingRepository bookingRows;@Autowired MutableFixtureClock clock;@Autowired EntityManager em;
 UUID owner,admin,stay,room;
 @BeforeEach void fixture(){
  clock.reset();owner=UUID.randomUUID();admin=UUID.randomUUID();stay=UUID.randomUUID();room=UUID.randomUUID();
  for(UUID id:List.of(owner,admin))j.update("insert into users(id,email,role,credential_state) values(?,?,?,'active')",id,"fixture-"+id+"@example.test",id.equals(admin)?"admin":"customer");
  j.update("insert into accommodations(id,name,status,timezone,cleaning_fee_cents,service_fee_cents) values(?,'Synthetic completion stay','active','Asia/Ho_Chi_Minh',10000,3500)",stay);
  j.update("insert into room(id,accommodation_id,name,status,nightly_price_cents,max_guests_per_room,stock_total) values(?,?,'Synthetic completion tier','available',29900,2,1)",room,stay);
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new CurrentUser(admin,"fixture@example.test",UserRole.ADMIN),null,List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
 }
 @AfterEach void clear(){clock.reset();SecurityContextHolder.clearContext();}
 BookingResponse property(long points){
  var q=quotes.create(owner,new QuoteRequest(stay,room,LocalDate.of(2026,11,1),LocalDate.of(2026,11,4),1,1,0,null,points));
  var b=bookings.create(owner,new CreateBookingRequest(q.id(),new GuestInformation("Synthetic guest","fixture@example.test","+84912345678",null),"pay_at_property"),"fixture-book");
  payments.create(owner,b.id(),"pay_at_property","fixture-payment");return b;
 }
 @Test void unpaidCannotCompleteAndPropertySettlementEarnsOnceAtLocalCheckoutWithAudit(){
  var b=property(0);assertFalse(completed.completeEligible(b.id(),Instant.parse("2026-11-04T04:00:00Z")));
  var p=demo.settleAtProperty(admin,b.id(),"fixture-settle");assertEquals("success",p.status());assertNull(p.settlement());
  demo.settleAtProperty(admin,b.id(),"fixture-settle-again");assertEquals(1,j.queryForObject("select count(*) from audit_records where source_id=? and action='demo_property_settled'",Integer.class,b.id()));
  clock.set(Instant.parse("2026-11-04T03:59:59Z"));assertTrue(bookingRows.findCompletionCandidateIds(clock.instant(),PageRequest.of(0,100)).isEmpty());assertFalse(completed.completeEligible(b.id(),clock.instant()));
  clock.set(Instant.parse("2026-11-04T04:00:00Z"));assertTrue(bookingRows.findCompletionCandidateIds(clock.instant(),PageRequest.of(0,100)).contains(b.id()));
  assertTrue(completed.completeEligible(b.id(),clock.instant()));em.flush();assertFalse(completed.completeEligible(b.id(),clock.instant()));
  assertEquals(1032,j.queryForObject("select available_points from reward_wallets where user_id=?",Long.class,owner));
  assertEquals(1,j.queryForObject("select count(*) from reward_ledger_entries where user_id=? and source_key=?",Integer.class,owner,"earn:"+b.id()));
  assertEquals("completed",bookings.get(owner,b.id()).status());
 }
 @Test void requestedRefundRestoresActualPointsOnlyOnAuditedConfirmationAndKeepsCollectionTime(){
  // Labelled rollback-only wallet fixture. No demo credit is persisted by this test.
  j.update("insert into reward_wallets(user_id,available_points,reserved_points,lifetime_earned_points) values(?,10000,0,10000)",owner);
  var b=property(1000);assertEquals(9000,j.queryForObject("select available_points from reward_wallets where user_id=?",Long.class,owner));
  var p=demo.settleAtProperty(admin,b.id(),"fixture-settle");assertEquals(102200,p.originalAmount().amountCents());
  var cancelled=lifecycle.cancel(owner,b.id(),"Synthetic paid cancellation","fixture-cancel");assertEquals("requested",cancelled.refundStatus());
  assertEquals(9000,j.queryForObject("select available_points from reward_wallets where user_id=?",Long.class,owner));
  UUID refund=j.queryForObject("select id from refund_requests where booking_id=?",UUID.class,b.id());var result=demo.confirmRefund(admin,refund,"Synthetic confirmed refund","fixture-refund");
  assertEquals("confirmed",result.status());demo.confirmRefund(admin,refund,"Synthetic confirmed refund","fixture-refund-again");em.flush();
  assertEquals(10000,j.queryForObject("select available_points from reward_wallets where user_id=?",Long.class,owner));
  assertEquals(1,j.queryForObject("select count(*) from reward_ledger_entries where source_key=?",Integer.class,"restored:"+b.id()));
  assertEquals(1,j.queryForObject("select count(*) from audit_records where source_id=? and action='demo_refund_confirmed'",Integer.class,refund));
  assertEquals(MutableFixtureClock.INITIAL,j.queryForObject("select collected_at from payments where id=?",java.sql.Timestamp.class,p.id()).toInstant());
  assertEquals("refunded",payments.getOwned(owner,p.id()).status());assertEquals("confirmed",bookings.get(owner,b.id()).refundStatus());
 }
}
