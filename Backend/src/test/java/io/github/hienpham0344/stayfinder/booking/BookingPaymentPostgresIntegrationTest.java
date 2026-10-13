package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.testsupport.*;
import io.github.hienpham0344.stayfinder.booking.dto.*;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.payment.service.*;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;import org.springframework.test.context.ContextConfiguration;
import org.springframework.beans.factory.annotation.Autowired;import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.persistence.EntityManager;
import javax.crypto.Mac;import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
@Tag("postgres") @SpringBootTest @ContextConfiguration(initializers=ApprovedPostgresInitializer.class)
@Import(ApprovedPostgresContext.class) @Transactional
class BookingPaymentPostgresIntegrationTest {
 @Autowired JdbcTemplate j;@Autowired BookingQuoteService quotes;@Autowired BookingService bookings;@Autowired PaymentService payments;
 @Autowired SepayReceiptService receipts;@Autowired SepayReconciliationService reconciliation;@Autowired PaymentWebhookEventRepository events;
 @Autowired BookingLifecycleService lifecycle;@Autowired EntityManager em;@Autowired Clock clock;
 UUID owner,stay,room;
 @BeforeEach void fixture(){
  owner=UUID.randomUUID();stay=UUID.randomUUID();room=UUID.randomUUID();
  j.update("insert into users(id,email,role,credential_state) values(?,?,'customer','active')",owner,"fixture-"+owner+"@example.test");
  j.update("insert into accommodations(id,name,status,timezone,cleaning_fee_cents,service_fee_cents) values(?,'Synthetic transaction stay','active','Asia/Ho_Chi_Minh',10000,3500)",stay);
  j.update("insert into room(id,accommodation_id,name,status,nightly_price_cents,max_guests_per_room,stock_total) values(?,?,'Synthetic transaction room','available',29900,2,1)",room,stay);
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new CurrentUser(owner,"fixture@example.test",UserRole.CUSTOMER),null,List.of()));
 }
 @AfterEach void clear(){SecurityContextHolder.clearContext();}
 @Test void propertyAndBankBookingsPersistSeparateSnapshotsAndReplayWithNoSecondDebit(){
  var quote=quotes.create(owner,selection());
  var request=new CreateBookingRequest(quote.id(),new GuestInformation("Synthetic guest","fixture@example.test","+84912345678",null),"pay_at_property");
  var book=bookings.create(owner,request,"fixture-property");
  assertEquals("confirmed",book.status());assertEquals("pending",book.paymentStatus());assertEquals(103200,book.quote().total().amountCents());
  assertEquals(book.id(),bookings.create(owner,request,"fixture-property").id());
  var p=payments.create(owner,book.id(),"pay_at_property","fixture-payment");assertNull(p.settlement());assertEquals("pending",p.status());
  assertEquals(1,j.queryForObject("select count(*) from bookings where user_id=?",Integer.class,owner));
  assertEquals(1,j.queryForObject("select count(*) from reward_reservations where user_id=?",Integer.class,owner));
  assertTrue(j.queryForObject("select bool_and(rs.id<>rs.source_room_id and acs.id<>acs.source_accommodation_id) from booking_details d join bookings b on b.id=d.booking_id join room_snapshot rs on rs.id=d.room_snapshot_id join accommodation_snapshot acs on acs.id=d.accommodation_snapshot_id where b.user_id=?",Boolean.class,owner));
  assertThrows(BusinessException.class,()->bookings.get(UUID.randomUUID(),book.id()));
 }
 @Test void nativeSignedReceiptConfirmsExactCollectionOnceAndPaidCancelCopiesOriginalFx()throws Exception{
  var q=quotes.create(owner,selection());
  var book=bookings.create(owner,new CreateBookingRequest(q.id(),new GuestInformation("Synthetic guest","fixture@example.test","+84912345678",null),"bank_transfer"),"fixture-bank");
  var p=payments.create(owner,book.id(),"bank_transfer","fixture-bank-payment");
  assertEquals(25800000,p.settlement().amount());String nativeId=Long.toString(100000000+Math.abs(UUID.randomUUID().getMostSignificantBits()%100000000));
  byte[] body=("{\"id\":"+nativeId+",\"gateway\":\"MBBank\",\"transactionDate\":\"2026-10-13 19:00:00\",\"accountNumber\":\"000123456789\",\"code\":\""+p.settlement().transferReference()+"\",\"content\":\"Synthetic "+p.settlement().transferReference()+"\",\"transferType\":\"in\",\"transferAmount\":25800000}").getBytes(StandardCharsets.UTF_8);
  String ts=Long.toString(clock.instant().getEpochSecond());assertTrue(receipts.receive(body,signature(body,ts),ts).success());
  var event=events.lockNativeEvent("sepay","test",nativeId).orElseThrow();reconciliation.process(event.getId());em.flush();em.clear();
  var paid=bookings.get(owner,book.id());assertEquals("confirmed",paid.status());assertEquals("success",paid.paymentStatus());
  assertEquals("success",payments.getOwned(owner,p.id()).status());
  assertTrue(receipts.receive(body,signature(body,ts),ts).success());reconciliation.process(event.getId());
  assertEquals(1,j.queryForObject("select count(*) from payment_webhook_events where event_id=?",Integer.class,nativeId));
  assertEquals("consumed",j.queryForObject("select state from reward_reservations where booking_id=?",String.class,book.id()));
  var cancelled=lifecycle.cancel(owner,book.id(),"Synthetic cancel","fixture-paid-cancel");em.flush();
  assertEquals("cancelled",cancelled.status());assertEquals("requested",cancelled.refundStatus());assertEquals("success",cancelled.paymentStatus());
  assertEquals(25800000,j.queryForObject("select settlement_vnd from refund_requests where booking_id=?",Long.class,book.id()));
  assertEquals("25000",j.queryForObject("select usd_to_vnd_rate from refund_requests where booking_id=?",String.class,book.id()));
 }
 private QuoteRequest selection(){return new QuoteRequest(stay,room,LocalDate.of(2026,11,1),LocalDate.of(2026,11,4),1,1,0,null,0L);}
 private static String signature(byte[] raw,String ts)throws Exception{
  var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec("fixture-only-sepay-hmac-secret-32bytes".getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
  mac.update((ts+".").getBytes(StandardCharsets.US_ASCII));return "sha256="+HexFormat.of().formatHex(mac.doFinal(raw));
 }
}
