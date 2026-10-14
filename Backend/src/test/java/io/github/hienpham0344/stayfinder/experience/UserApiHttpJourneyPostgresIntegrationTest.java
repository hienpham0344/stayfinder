package io.github.hienpham0344.stayfinder.experience;
import io.github.hienpham0344.stayfinder.testsupport.*;import io.github.hienpham0344.stayfinder.auth.service.AuthService;import io.github.hienpham0344.stayfinder.auth.dto.RegisterRequest;
import io.github.hienpham0344.stayfinder.booking.service.*;import io.github.hienpham0344.stayfinder.booking.dto.*;import io.github.hienpham0344.stayfinder.payment.service.PaymentService;import io.github.hienpham0344.stayfinder.demo.service.DemoPaymentOperationsService;import io.github.hienpham0344.stayfinder.notification.service.NotificationService;import io.github.hienpham0344.stayfinder.media.service.LocalMediaStorage;import io.github.hienpham0344.stayfinder.common.enums.UserRole;import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.*;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.boot.test.web.server.LocalServerPort;import org.springframework.test.context.ContextConfiguration;import org.springframework.context.annotation.Import;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.jdbc.core.namedparam.*;import org.springframework.transaction.PlatformTransactionManager;import org.springframework.transaction.support.TransactionTemplate;import org.springframework.security.crypto.password.PasswordEncoder;import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.authority.SimpleGrantedAuthority;import org.springframework.security.core.context.SecurityContextHolder;import tools.jackson.databind.json.JsonMapper;import java.nio.file.*;import java.time.*;import java.util.*;import java.util.concurrent.TimeUnit;import java.util.function.Supplier;import static org.junit.jupiter.api.Assertions.*;
/** Real frontend adapters -> loopback HTTP -> Spring Security/controllers -> approved private PG.
 * Temporary fixtures are explicitly owned/verified and removed; no public seed or provider call. */
@Tag("postgres") @SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"stayfinder.demo-operations.enabled=true","server.address=127.0.0.1"})
@ContextConfiguration(initializers=ApprovedPostgresInitializer.class) @Import(ApprovedPostgresContext.class)
class UserApiHttpJourneyPostgresIntegrationTest{
 @LocalServerPort int port;@Autowired JdbcTemplate j;@Autowired PlatformTransactionManager manager;@Autowired AuthService auth;@Autowired PasswordEncoder encoder;
 @Autowired BookingQuoteService quotes;@Autowired BookingService bookings;@Autowired PaymentService payments;@Autowired DemoPaymentOperationsService demo;@Autowired CompletedStayService completion;@Autowired NotificationService inbox;@Autowired MutableFixtureClock clock;@Autowired LocalMediaStorage files;@Autowired JsonMapper json;
 UUID run=UUID.randomUUID(),owner,admin=UUID.randomUUID(),stay=UUID.randomUUID(),room=UUID.randomUUID(),offer=UUID.randomUUID();
 String password="Synthetic HTTP fixture only 123!",ownerEmail="fixture-http-owner-"+run+"@example.test",changedEmail="fixture-http-changed-"+run+"@example.test",otherEmail="fixture-http-other-"+run+"@example.test",adminEmail="fixture-http-admin-"+run+"@example.test";
 void tx(Runnable work){new TransactionTemplate(manager).executeWithoutResult(s->work.run());}<T>T read(Supplier<T> work){return new TransactionTemplate(manager).execute(s->work.get());}
 @Test void actualFrontendAdaptersExerciseUserHttpContracts()throws Exception{
  clock.reset();Path root=Path.of(System.getProperty("user.dir")).toAbsolutePath();while(root!=null&&!(Files.isDirectory(root.resolve("Frontend"))&&Files.isDirectory(root.resolve("Backend"))))root=root.getParent();assertNotNull(root,"Repository root is required");
  Path evidence=root.resolve(".superpowers/sdd/2026-10-12-user-experience-plan/http-journey.log");Files.createDirectories(evidence.getParent());
  try{
   tx(()->{
    j.update("insert into users(id,email,full_name,role,credential_state,password_hash) values(?,?,'Synthetic HTTP admin','admin','active',?)",admin,adminEmail,encoder.encode(password));
    j.update("insert into accommodations(id,name,status,timezone,cleaning_fee_cents,service_fee_cents) values(?,'Synthetic HTTP stay','active','Asia/Ho_Chi_Minh',10000,3500)",stay);
    j.update("insert into room(id,accommodation_id,name,status,nightly_price_cents,max_guests_per_room,stock_total) values(?,?,'Synthetic HTTP tier','available',29900,2,3)",room,stay);
    j.update("insert into reward_offers(id,code,title,kind,points_cost,active,validity_days,discount_percent,discount_cap_cents,minimum_room_subtotal_cents,fulfilment_description) values(?,?,'Synthetic HTTP voucher','discount_voucher',1000,true,30,5,2500,10000,'Temporary HTTP fixture')",offer,"HTTP"+offer.toString().replace("-",""));
   });
   owner=auth.register(new RegisterRequest("Synthetic HTTP owner",ownerEmail,password)).user().id();
   var q=quotes.create(owner,new QuoteRequest(stay,room,LocalDate.of(2026,11,1),LocalDate.of(2026,11,4),1,1,0,null,0L));
   var b=bookings.create(owner,new CreateBookingRequest(q.id(),new GuestInformation("Synthetic HTTP guest",ownerEmail,"+84912345678",null),"pay_at_property"),"fixture-http-completed");
   payments.create(owner,b.id(),"pay_at_property","fixture-http-payment");
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new CurrentUser(admin,adminEmail,UserRole.ADMIN),null,List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
   demo.settleAtProperty(admin,b.id(),"fixture-http-settle");clock.set(Instant.parse("2026-11-04T04:00:00Z"));assertTrue(completion.completeEligible(b.id(),clock.instant()));SecurityContextHolder.clearContext();inbox.materializeBatch();
   var fixture=new LinkedHashMap<String,Object>();fixture.put("schema",PostgresTestTarget.SCHEMA);fixture.put("baseUrl","http://127.0.0.1:"+port+"/api");fixture.put("ownerId",owner);fixture.put("ownerEmail",ownerEmail);fixture.put("changedEmail",changedEmail);fixture.put("otherEmail",otherEmail);fixture.put("adminEmail",adminEmail);fixture.put("password",password);fixture.put("stayId",stay);fixture.put("roomId",room);fixture.put("completedBookingId",b.id());fixture.put("offerId",offer);
   var command=new ProcessBuilder("C:/Program Files/nodejs/node.exe","--test",root.resolve("Frontend/tests/userApiJourney.test.mjs").toString());command.directory(root.toFile());command.environment().put("STAYFINDER_HTTP_FIXTURE",json.writeValueAsString(fixture));command.redirectErrorStream(true);command.redirectOutput(evidence.toFile());
   var child=command.start();boolean finished=child.waitFor(660,TimeUnit.SECONDS);if(!finished){child.destroyForcibly();child.waitFor(10,TimeUnit.SECONDS);fail("HTTP journey timed out; sanitized evidence: "+evidence);}
   String output=Files.readString(evidence);System.out.println(output);assertEquals(0,child.exitValue(),"Frontend HTTP journey failed; evidence: "+evidence);assertTrue(output.contains("pass 1"),"HTTP journey must actually run, never skip");
   assertEquals(1,read(()->j.queryForObject("select count(*) from support_reports where user_id=?",Integer.class,owner)));assertEquals(32,read(()->j.queryForObject("select available_points from reward_wallets where user_id=?",Long.class,owner)));
   assertEquals(1,read(()->j.queryForObject("select count(*) from refund_requests where user_id=? and status='requested'",Integer.class,owner)));
   UUID refundId=read(()->j.queryForObject("select id from refund_requests where user_id=? and status='requested'",UUID.class,owner));
   var executor=java.util.concurrent.Executors.newFixedThreadPool(2);var start=new java.util.concurrent.CountDownLatch(1);var pending=new ArrayList<java.util.concurrent.Future<io.github.hienpham0344.stayfinder.payment.dto.RefundResponse>>();
   try{
    for(int index=0;index<2;index++){final int attempt=index;pending.add(executor.submit(()->{start.await();SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new CurrentUser(admin,adminEmail,UserRole.ADMIN),null,List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));try{return demo.confirmRefund(admin,refundId,"Synthetic HTTP demo refund","fixture-http-refund-"+attempt);}finally{SecurityContextHolder.clearContext();}}));}
    start.countDown();for(var future:pending){var result=future.get(45,TimeUnit.SECONDS);assertEquals(refundId,result.id());assertEquals("confirmed",result.status());}
    assertEquals(1,read(()->j.queryForObject("select count(*) from audit_records where source_id=? and action='demo_refund_confirmed'",Integer.class,refundId)));
    assertEquals(32,read(()->j.queryForObject("select available_points from reward_wallets where user_id=?",Long.class,owner)));
   }finally{executor.shutdownNow();assertTrue(executor.awaitTermination(10,TimeUnit.SECONDS));}

  }finally{SecurityContextHolder.clearContext();cleanup();clock.reset();}
 }

 @Test void nativeAcknowledgementRequiresReceiptTransactionCommit()throws Exception{
  clock.reset();String eventId=Long.toString(java.util.concurrent.ThreadLocalRandom.current().nextLong(9_000_000_000_000_000L,9_000_000_100_000_000L));
  byte[] body=("{\"id\":"+eventId+",\"gateway\":\"MBBank\",\"transactionDate\":\"2026-10-13 19:00:00\",\"accountNumber\":\"000123456789\",\"code\":\"SFTEST000001\",\"content\":\"Synthetic HTTP receipt\",\"transferType\":\"in\",\"transferAmount\":25800000}").getBytes(java.nio.charset.StandardCharsets.UTF_8);
  String hash=HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(body)),timestamp=Long.toString(clock.instant().getEpochSecond());
  var mac=javax.crypto.Mac.getInstance("HmacSHA256");mac.init(new javax.crypto.spec.SecretKeySpec("fixture-only-sepay-hmac-secret-32bytes".getBytes(java.nio.charset.StandardCharsets.UTF_8),"HmacSHA256"));mac.update((timestamp+".").getBytes(java.nio.charset.StandardCharsets.US_ASCII));String signature="sha256="+HexFormat.of().formatHex(mac.doFinal(body));
  var txm=(org.springframework.transaction.support.AbstractPlatformTransactionManager)manager;var original=new ArrayList<>(txm.getTransactionExecutionListeners());var failCommit=new java.util.concurrent.atomic.AtomicBoolean(true);
  txm.addListener(new org.springframework.transaction.TransactionExecutionListener(){@Override public void beforeCommit(org.springframework.transaction.TransactionExecution t){if(t.getTransactionName().endsWith("SepayReceiptService.receive")&&failCommit.compareAndSet(true,false))throw new IllegalStateException("Synthetic receipt commit failure");}});
  var http=java.net.http.HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
  var request=java.net.http.HttpRequest.newBuilder(java.net.URI.create("http://127.0.0.1:"+port+"/api/payments/webhook/sepay")).timeout(Duration.ofSeconds(20)).header("Content-Type","application/json").header("X-SePay-Timestamp",timestamp).header("X-SePay-Signature",signature).POST(java.net.http.HttpRequest.BodyPublishers.ofByteArray(body)).build();
  try{
   assertEquals(0,read(()->j.queryForObject("select count(*) from payment_webhook_events where provider='sepay' and environment='test' and event_id=?",Integer.class,eventId)));
   var failed=http.send(request,java.net.http.HttpResponse.BodyHandlers.ofString());assertFalse(failCommit.get(),"Failure injection must execute at the receipt commit boundary");assertEquals(500,failed.statusCode());
   assertEquals(0,read(()->j.queryForObject("select count(*) from payment_webhook_events where provider='sepay' and environment='test' and event_id=?",Integer.class,eventId)));
   var retry=http.send(request,java.net.http.HttpResponse.BodyHandlers.ofString());assertEquals(200,retry.statusCode());assertTrue(json.readTree(retry.body()).path("success").asBoolean());
   assertEquals(200,http.send(request,java.net.http.HttpResponse.BodyHandlers.ofString()).statusCode());assertEquals(1,read(()->j.queryForObject("select count(*) from payment_webhook_events where provider='sepay' and environment='test' and event_id=? and payload_hash=?",Integer.class,eventId,hash)));
  }finally{failCommit.set(false);txm.setTransactionExecutionListeners(original);tx(()->j.update("delete from payment_webhook_events where provider='sepay' and environment='test' and event_id=? and payload_hash=? and payment_id is null",eventId,hash));clock.reset();}
 }

 void cleanup(){
  List<UUID> owners=read(()->j.queryForList("select id from users where (id=? and email=?) or (id=? and email in (?,?)) or email=?",UUID.class,admin,adminEmail,owner,ownerEmail,changedEmail,otherEmail));
  List<UUID> mediaIds=new ArrayList<>();
  tx(()->{
   var n=new NamedParameterJdbcTemplate(j);var p=new MapSqlParameterSource("owners",owners).addValue("stay",stay).addValue("room",room);
   if(!owners.isEmpty()){
    if(owner!=null&&j.queryForObject("select count(*) from users where id=?",Integer.class,owner)==1&&!owners.contains(owner))throw new IllegalStateException("Refuse cleanup of changed fixture identity");
    mediaIds.addAll(n.queryForList("select id from media_assets where user_id in (:owners)",p,UUID.class));
    var rs=n.queryForList("select d.room_snapshot_id from booking_details d join bookings b on b.id=d.booking_id where b.user_id in (:owners)",p,UUID.class);var acs=n.queryForList("select d.accommodation_snapshot_id from booking_details d join bookings b on b.id=d.booking_id where b.user_id in (:owners)",p,UUID.class);
    n.update("update booking_quotes set consumed_booking_id=null where user_id in (:owners) and accommodation_id=:stay",p);
    n.update("delete from payment_webhook_events where payment_id in (select id from payments where user_id in (:owners))",p);
    for(String table:List.of("notifications","notification_inbox_state","user_preferences","support_reports","media_assets","reviews","refund_requests","payments","reward_reservations","outbox_events","idempotency_records","reward_ledger_entries"))n.update("delete from "+table+" where user_id in (:owners)",p);
    n.update("delete from audit_records where actor_id in (:owners)",p);
    n.update("delete from booking_details where booking_id in (select id from bookings where user_id in (:owners))",p);n.update("delete from bookings where user_id in (:owners)",p);n.update("delete from booking_quotes where user_id in (:owners)",p);
    if(!rs.isEmpty())n.update("delete from room_snapshot where id in (:ids)",Map.of("ids",rs));if(!acs.isEmpty())n.update("delete from accommodation_snapshot where id in (:ids)",Map.of("ids",acs));
    n.update("delete from reward_claims where user_id in (:owners)",p);n.update("delete from reward_wallets where user_id in (:owners)",p);
    n.update("delete from refresh_tokens where session_id in (select id from auth_sessions where user_id in (:owners))",p);n.update("delete from auth_sessions where user_id in (:owners)",p);n.update("delete from auth_audit_events where user_id in (:owners)",p);n.update("delete from users where id in (:owners)",p);
   }
   j.update("delete from reward_offers where id=? and code=?",offer,"HTTP"+offer.toString().replace("-",""));j.update("delete from room where id=? and accommodation_id=?",room,stay);j.update("delete from accommodations where id=? and name='Synthetic HTTP stay'",stay);
  });for(UUID id:mediaIds)files.delete(id);
 }
}
