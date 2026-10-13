package io.github.hienpham0344.stayfinder.booking;
import io.github.hienpham0344.stayfinder.testsupport.*;
import io.github.hienpham0344.stayfinder.booking.dto.*;import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.payment.service.*;import io.github.hienpham0344.stayfinder.payment.repository.PaymentWebhookEventRepository;
import io.github.hienpham0344.stayfinder.reward.service.RewardService;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.junit.jupiter.api.*;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.test.context.ContextConfiguration;import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;import org.springframework.transaction.support.TransactionTemplate;
import javax.crypto.Mac;import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;import java.util.concurrent.*;import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;

/** Separate committed transactions are needed to exercise real row/advisory waits.
 * Only temporary synthetic UUID-owned fixtures are created, then removed in dependency order.
 * Cleanup never resets a table/schema, copies public data or touches any other owner's rows.
 */
@Tag("postgres") @SpringBootTest @ContextConfiguration(initializers=ApprovedPostgresInitializer.class) @Import(ApprovedPostgresContext.class)
class ConcurrentTransactionsPostgresIntegrationTest {
 @Autowired JdbcTemplate j;@Autowired PlatformTransactionManager manager;@Autowired BookingQuoteService quotes;@Autowired BookingService bookings;
 @Autowired PaymentService payments;@Autowired SepayReceiptService receipts;@Autowired SepayReconciliationService reconciliation;@Autowired RewardService rewards;
 @Autowired MutableFixtureClock clock;
 @Autowired io.github.hienpham0344.stayfinder.auth.service.AuthService auth;
 @Autowired io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository sessions;
 @Autowired io.github.hienpham0344.stayfinder.user.repository.UserRepository users;
 @Autowired org.springframework.security.crypto.password.PasswordEncoder encoder;
 UUID owner,other,stay,room,offer;String nativeId;String nativeHash;
 void tx(Runnable work){new TransactionTemplate(manager).executeWithoutResult(s->work.run());}
 <T> T read(Supplier<T> work){return new TransactionTemplate(manager).execute(s->work.get());}
 @BeforeEach void fixture(){
  clock.reset();owner=UUID.randomUUID();other=UUID.randomUUID();stay=UUID.randomUUID();room=UUID.randomUUID();
  tx(()->{
   for(UUID id:List.of(owner,other))j.update("insert into stayfinder_test_20261013.users(id,email,role,credential_state) values(?,?,'customer','active')",id,"fixture-concurrency-"+id+"@example.test");
   j.update("insert into stayfinder_test_20261013.accommodations(id,name,status,timezone,cleaning_fee_cents,service_fee_cents) values(?,'Synthetic concurrency stay','active','Asia/Ho_Chi_Minh',10000,3500)",stay);
   j.update("insert into stayfinder_test_20261013.room(id,accommodation_id,name,status,nightly_price_cents,max_guests_per_room,stock_total) values(?,?,'Synthetic concurrency tier','available',29900,2,1)",room,stay);
  });
 }
 @AfterEach void cleanup(){
  try{tx(()->{
   var n=new NamedParameterJdbcTemplate(j);var p=new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("owners",List.of(owner,other)).addValue("stay",stay).addValue("room",room);
   int verified=j.queryForObject("select count(*) from stayfinder_test_20261013.users where (id=? and email=?) or (id=? and email=?)",Integer.class,owner,"fixture-concurrency-"+owner+"@example.test",other,"fixture-concurrency-"+other+"@example.test");
   if(verified!=2)throw new IllegalStateException("Refuse cleanup of unverified fixture owners");
   var roomSnapshots=n.queryForList("select d.room_snapshot_id from stayfinder_test_20261013.booking_details d join stayfinder_test_20261013.bookings b on b.id=d.booking_id where b.user_id in (:owners)",p,UUID.class);
   var staySnapshots=n.queryForList("select d.accommodation_snapshot_id from stayfinder_test_20261013.booking_details d join stayfinder_test_20261013.bookings b on b.id=d.booking_id where b.user_id in (:owners)",p,UUID.class);
   n.update("update stayfinder_test_20261013.booking_quotes set consumed_booking_id=null where user_id in (:owners) and accommodation_id=:stay",p);
   n.update("delete from stayfinder_test_20261013.payment_webhook_events where payment_id in (select id from stayfinder_test_20261013.payments where user_id in (:owners))",p);
   if(nativeId!=null&&nativeHash!=null)j.update("delete from stayfinder_test_20261013.payment_webhook_events where provider='sepay' and environment='test' and event_id=? and payload_hash=?",nativeId,nativeHash);
   for(String table:List.of("refund_requests","payments","reward_reservations","outbox_events","idempotency_records","reward_ledger_entries"))
    n.update("delete from stayfinder_test_20261013."+table+" where user_id in (:owners)",p);
   n.update("delete from stayfinder_test_20261013.audit_records where actor_id in (:owners)",p);
   n.update("delete from stayfinder_test_20261013.booking_details where booking_id in (select id from stayfinder_test_20261013.bookings where user_id in (:owners))",p);
   n.update("delete from stayfinder_test_20261013.bookings where user_id in (:owners)",p);n.update("delete from stayfinder_test_20261013.booking_quotes where user_id in (:owners)",p);
   if(!roomSnapshots.isEmpty())n.update("delete from stayfinder_test_20261013.room_snapshot where id in (:ids)",Map.of("ids",roomSnapshots));
   if(!staySnapshots.isEmpty())n.update("delete from stayfinder_test_20261013.accommodation_snapshot where id in (:ids)",Map.of("ids",staySnapshots));
   n.update("delete from stayfinder_test_20261013.reward_claims where user_id in (:owners)",p);
   n.update("delete from stayfinder_test_20261013.reward_wallets where user_id in (:owners)",p);
   if(offer!=null)j.update("delete from stayfinder_test_20261013.reward_offers where id=? and code=?",offer,"FX"+offer.toString().replace("-",""));
   n.update("delete from stayfinder_test_20261013.refresh_tokens where session_id in (select id from stayfinder_test_20261013.auth_sessions where user_id in (:owners))",p);
   n.update("delete from stayfinder_test_20261013.auth_sessions where user_id in (:owners)",p);
   n.update("delete from stayfinder_test_20261013.auth_audit_events where user_id in (:owners)",p);
   n.update("delete from stayfinder_test_20261013.users where id in (:owners)",p);
   n.update("delete from stayfinder_test_20261013.room where id=:room and accommodation_id=:stay",p);
   n.update("delete from stayfinder_test_20261013.accommodations where id=:stay and name='Synthetic concurrency stay'",p);
  });}finally{clock.reset();}
 }
 QuoteResponse quote(UUID user,int quantity){return quotes.create(user,new QuoteRequest(stay,room,LocalDate.of(2026,11,1),LocalDate.of(2026,11,4),quantity,quantity,0,null,0L));}
 CreateBookingRequest request(QuoteResponse q,String method){return new CreateBookingRequest(q.id(),new GuestInformation("Synthetic guest","fixture@example.test","+84912345678",null),method);}
 List<Object> parallel(Supplier<?> left,Supplier<?> right)throws Exception{
  ExecutorService executor=Executors.newFixedThreadPool(2);CountDownLatch start=new CountDownLatch(1);
  try{
   List<Future<Object>> futures=new ArrayList<>();
   for(var work:List.of(left,right))futures.add(executor.submit(()->{start.await();try{return work.get();}catch(BusinessException e){return e.getErrorCode();}}));
   start.countDown();List<Object> result=new ArrayList<>();for(var f:futures)result.add(f.get(45,TimeUnit.SECONDS));return result;
  }finally{executor.shutdownNow();assertTrue(executor.awaitTermination(10,TimeUnit.SECONDS));}
 }
 @Test void lastRoomHasOneWinnerAndFailedTransactionLeavesNoSnapshotsWalletOrKey()throws Exception{
  var a=quote(owner,1);var b=quote(other,1);
  var result=parallel(()->bookings.create(owner,request(a,"pay_at_property"),"same-namespace-key"),()->bookings.create(other,request(b,"pay_at_property"),"same-namespace-key"));
  assertEquals(1,result.stream().filter(BookingResponse.class::isInstance).count());assertEquals(1,result.stream().filter(ErrorCode.ROOM_NOT_AVAILABLE::equals).count());
  read(()->{
   assertEquals(1,j.queryForObject("select count(*) from bookings where user_id in (?,?)",Integer.class,owner,other));
   assertEquals(1,j.queryForObject("select count(*) from room_snapshot where source_room_id=?",Integer.class,room));
   assertEquals(1,j.queryForObject("select count(*) from accommodation_snapshot where source_accommodation_id=?",Integer.class,stay));
   assertEquals(1,j.queryForObject("select count(*) from reward_wallets where user_id in (?,?)",Integer.class,owner,other));
   assertEquals(1,j.queryForObject("select count(*) from idempotency_records where user_id in (?,?)",Integer.class,owner,other));return null;
  });
 }
 @Test void stockThreeAcceptsQuantityTwoAndOneInSeparateTransactions()throws Exception{
  tx(()->j.update("update stayfinder_test_20261013.room set stock_total=3 where id=?",room));
  var a=quote(owner,2);var b=quote(other,1);
  var result=parallel(()->bookings.create(owner,request(a,"pay_at_property"),"quantity-two"),()->bookings.create(other,request(b,"pay_at_property"),"quantity-one"));
  assertEquals(2,result.stream().filter(BookingResponse.class::isInstance).count());
  assertEquals(3,read(()->j.queryForObject("select sum(d.quantity) from booking_details d join bookings b on b.id=d.booking_id where b.user_id in (?,?)",Integer.class,owner,other)));
 }
 @Test void sameKeyConcurrentBookingReturnsOnePersistedBookingAndOneSnapshotSet()throws Exception{
  var q=quote(owner,1);var request=request(q,"pay_at_property");
  var result=parallel(()->bookings.create(owner,request,"duplicate"),()->bookings.create(owner,request,"duplicate"));
  assertTrue(result.stream().allMatch(BookingResponse.class::isInstance));assertEquals(((BookingResponse)result.get(0)).id(),((BookingResponse)result.get(1)).id());
  assertEquals(1,read(()->j.queryForObject("select count(*) from room_snapshot where source_room_id=?",Integer.class,room)));
 }
 @Test void twoRewardClaimsCannotSpendTheSameThousandPoints()throws Exception{
  offer=UUID.randomUUID();tx(()->{
   j.update("insert into stayfinder_test_20261013.reward_wallets(user_id,available_points,reserved_points,lifetime_earned_points) values(?,1000,0,1000)",owner);
   j.update("insert into stayfinder_test_20261013.reward_offers(id,code,title,kind,points_cost,active,validity_days,discount_percent,discount_cap_cents,minimum_room_subtotal_cents,fulfilment_description) values(?,?,'Synthetic voucher','discount_voucher',1000,true,30,5,2500,10000,'Temporary concurrency fixture')",offer,"FX"+offer.toString().replace("-",""));
  });
  var result=parallel(()->rewards.claim(owner,offer,"claim-one"),()->rewards.claim(owner,offer,"claim-two"));
  assertEquals(1,result.stream().filter(io.github.hienpham0344.stayfinder.reward.dto.RewardClaimResponse.class::isInstance).count());
  assertEquals(1,result.stream().filter(ErrorCode.INSUFFICIENT_POINTS::equals).count());
  read(()->{assertEquals(0,j.queryForObject("select available_points from reward_wallets where user_id=?",Long.class,owner));assertEquals(1,j.queryForObject("select count(*) from reward_claims where user_id=?",Integer.class,owner));return null;});
 }
 @Test void parallelNativeReceiptAndProcessingCommitOnceAndLaterConflictPreservesOriginal()throws Exception{
  var q=quote(owner,1);var b=bookings.create(owner,request(q,"bank_transfer"),"bank");var p=payments.create(owner,b.id(),"bank_transfer","bank-payment");
  nativeId=Long.toString(ThreadLocalRandom.current().nextLong(9_000_000_000_000_000L,9_000_000_100_000_000L));
  assertEquals(0,read(()->j.queryForObject("select count(*) from payment_webhook_events where provider='sepay' and environment='test' and event_id=?",Integer.class,nativeId)));
  byte[] body=body(p.settlement().transferReference(),p.settlement().amount());nativeHash=HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(body));
  String ts=Long.toString(clock.instant().getEpochSecond()),sig=signature(body,ts);
  var result=parallel(()->receipts.receive(body,sig,ts),()->receipts.receive(body,sig,ts));assertTrue(result.stream().allMatch(io.github.hienpham0344.stayfinder.payment.dto.ProviderAcknowledgement.class::isInstance));
  UUID event=read(()->j.queryForObject("select id from payment_webhook_events where event_id=?",UUID.class,nativeId));
  parallel(()->{reconciliation.process(event);return true;},()->{reconciliation.process(event);return true;});
  assertEquals("confirmed",bookings.get(owner,b.id()).status());assertEquals("success",payments.getOwned(owner,p.id()).status());
  read(()->{assertEquals(1,j.queryForObject("select count(*) from payment_webhook_events where event_id=?",Integer.class,nativeId));assertEquals(1,j.queryForObject("select count(*) from outbox_events where user_id=? and event_type='booking_paid'",Integer.class,owner));return null;});
  byte[] changed=body(p.settlement().transferReference(),p.settlement().amount()+1);receipts.receive(changed,signature(changed,ts),ts);reconciliation.process(event);
  assertEquals("required",payments.getOwned(owner,p.id()).reconciliationStatus());assertEquals("success",payments.getOwned(owner,p.id()).status());
  assertEquals(nativeHash,read(()->j.queryForObject("select payload_hash from payment_webhook_events where id=?",String.class,event)));
 }
 @Test void concurrentRefreshOfOneTokenHasOneRotationAndOneGraceRetry()throws Exception{
  String password="Fixture only password 123!";tx(()->j.update("update stayfinder_test_20261013.users set password_hash=? where id=?",encoder.encode(password),owner));
  var login=auth.login(new io.github.hienpham0344.stayfinder.auth.dto.LoginRequest("fixture-concurrency-"+owner+"@example.test",password));
  ExecutorService executor=Executors.newFixedThreadPool(2);List<Future<Object>> pending=new ArrayList<>();var blockedThreads=new java.util.concurrent.ConcurrentLinkedQueue<Long>();
  try{
   tx(()->{
    sessions.lockById(login.sessionId()).orElseThrow();
    for(int i=0;i<2;i++)pending.add(executor.submit(()->{blockedThreads.add(Thread.currentThread().threadId());try{return auth.refresh(login.refreshToken());}catch(BusinessException e){return e.getErrorCode();}}));
    awaitBlocked(blockedThreads,2);
   });
   List<Object> result=new ArrayList<>();for(var f:pending)result.add(f.get(30,TimeUnit.SECONDS));
   assertEquals(1,result.stream().filter(io.github.hienpham0344.stayfinder.auth.dto.AuthSessionResponse.class::isInstance).count());
   assertEquals(1,result.stream().filter(ErrorCode.REFRESH_RETRY::equals).count());
   var replacement=result.stream().filter(io.github.hienpham0344.stayfinder.auth.dto.AuthSessionResponse.class::isInstance)
    .map(io.github.hienpham0344.stayfinder.auth.dto.AuthSessionResponse.class::cast).findFirst().orElseThrow();
   clock.set(MutableFixtureClock.INITIAL.plusSeconds(11));
   assertThrows(io.github.hienpham0344.stayfinder.auth.service.AuthServiceImpl.SessionReplayException.class,()->auth.refresh(login.refreshToken()));
   assertEquals(ErrorCode.SESSION_REVOKED,assertThrows(BusinessException.class,()->auth.refresh(replacement.refreshToken())).getErrorCode());
  }finally{executor.shutdownNow();assertTrue(executor.awaitTermination(10,TimeUnit.SECONDS));}
 }
 @Test void passwordChangeWhileLoginWaitsCannotAuthenticateOldPassword()throws Exception{
  String old="Fixture only password 123!",replacement="Fixture replacement password 123!";
  tx(()->j.update("update stayfinder_test_20261013.users set password_hash=? where id=?",encoder.encode(old),owner));
  ExecutorService executor=Executors.newSingleThreadExecutor();List<Future<Object>> pending=new ArrayList<>();var blockedThreads=new java.util.concurrent.ConcurrentLinkedQueue<Long>();
  try{
   tx(()->{
    users.lockById(owner).orElseThrow();
    pending.add(executor.submit(()->{blockedThreads.add(Thread.currentThread().threadId());try{return auth.login(new io.github.hienpham0344.stayfinder.auth.dto.LoginRequest("fixture-concurrency-"+owner+"@example.test",old));}catch(BusinessException e){return e.getErrorCode();}}));
    awaitBlocked(blockedThreads,1);
    auth.changePassword(owner,new io.github.hienpham0344.stayfinder.auth.dto.PasswordChangeRequest(old,replacement));
   });
   assertTrue(ErrorCode.INVALID_CREDENTIALS.equals(pending.getFirst().get(30,TimeUnit.SECONDS)),"Old password must not authenticate after a committed password change");
  }finally{executor.shutdownNow();assertTrue(executor.awaitTermination(10,TimeUnit.SECONDS));}
 }
 void awaitBlocked(java.util.Collection<Long> threadIds,int count){
  long limit=System.nanoTime()+TimeUnit.SECONDS.toNanos(3);int waiting=0;
  while(System.nanoTime()<limit){
   var pids=threadIds.stream().map(TransactionBackendTracker.PIDS::get).filter(Objects::nonNull).toList();
   waiting=pids.isEmpty()?0:new NamedParameterJdbcTemplate(j).queryForObject("select count(distinct pid) from pg_locks where not granted and pid in (:pids)",Map.of("pids",pids),Integer.class);
   if(waiting==count)return;
   try{Thread.sleep(20);}catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("Fixture interrupted");}
  }
  assertEquals(count,waiting,"Both service transactions must have reached the real row-lock wait");
 }

 byte[] body(String reference,long amount){return ("{\"id\":"+nativeId+",\"gateway\":\"MBBank\",\"transactionDate\":\"2026-10-13 19:00:00\",\"accountNumber\":\"000123456789\",\"code\":\""+reference+"\",\"content\":\"Synthetic "+reference+"\",\"transferType\":\"in\",\"transferAmount\":"+amount+"}").getBytes(StandardCharsets.UTF_8);}
 static String signature(byte[] body,String timestamp)throws Exception{
  var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec("fixture-only-sepay-hmac-secret-32bytes".getBytes(StandardCharsets.UTF_8),"HmacSHA256"));mac.update((timestamp+".").getBytes(StandardCharsets.US_ASCII));
  return "sha256="+HexFormat.of().formatHex(mac.doFinal(body));
 }
}
