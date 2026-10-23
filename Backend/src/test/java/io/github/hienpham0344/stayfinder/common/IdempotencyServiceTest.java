package io.github.hienpham0344.stayfinder.common;
import io.github.hienpham0344.stayfinder.common.idempotency.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.junit.jupiter.api.*;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
class IdempotencyServiceTest {
 private final UserRepository users=mock(UserRepository.class);
 private final IdempotencyRepository rows=mock(IdempotencyRepository.class);
 private final IdempotencyLockRepository keyLocks=mock(IdempotencyLockRepository.class);
 private final Map<String,IdempotencyRecord> persisted=new HashMap<>();
 private final JsonMapper mapper=JsonMapper.builder().findAndAddModules().build();
 private final UUID owner=UUID.randomUUID();private final AtomicInteger writes=new AtomicInteger();
 private IdempotencyService service(){return new IdempotencyService(rows,users,keyLocks,mapper,Clock.fixed(Instant.parse("2026-10-13T00:00:00Z"),ZoneOffset.UTC));}
 public record Result(UUID id,long amountCents){}
 @BeforeEach void setup(){
  User u=new User();u.setId(owner);u.setCredentialState("active");
  when(users.findById(any())).thenReturn(Optional.of(u));
  when(rows.findByUserIdAndOperationAndRequestKey(any(),any(),any())).thenAnswer(i->Optional.ofNullable(persisted.get(i.getArgument(0)+":"+i.getArgument(1)+":"+i.getArgument(2))));
  when(rows.save(any())).thenAnswer(i->{IdempotencyRecord row=i.getArgument(0);persisted.put(row.getUserId()+":"+row.getOperation()+":"+row.getRequestKey(),row);return row;});
 }
 @Test void matchingRetrySurvivesANewServiceInstanceWithoutRepeatingMutation(){
  var s=service();var first=s.execute(owner,"booking.create","request-1",s.fingerprint(Map.of("quote","q1")),Result.class,()->{writes.incrementAndGet();return new Result(UUID.randomUUID(),29900);});
  var restarted=service();var retry=restarted.execute(owner,"booking.create","request-1",restarted.fingerprint(Map.of("quote","q1")),Result.class,()->{fail("Must not mutate again");return null;});
  assertEquals(first,retry);assertEquals(1,writes.get());assertEquals(1,persisted.size());verify(keyLocks,times(2)).lock(owner,"booking.create","request-1");verify(users,never()).lockById(any());
 }
 @Test void changedPayloadIsConflictAndAnotherOwnerHasIndependentKeys(){
  var s=service();s.execute(owner,"booking.create","request-1",s.fingerprint(Map.of("quote","q1")),Result.class,()->new Result(UUID.randomUUID(),29900));
  var ex=assertThrows(BusinessException.class,()->s.execute(owner,"booking.create","request-1",s.fingerprint(Map.of("quote","q2")),Result.class,()->{fail("Payload conflict must not mutate");return null;}));
  assertEquals(ErrorCode.IDEMPOTENCY_CONFLICT,ex.getErrorCode());
  UUID other=UUID.randomUUID();assertNotNull(s.execute(other,"booking.create","request-1",s.fingerprint(Map.of("quote","q2")),Result.class,()->new Result(UUID.randomUUID(),40000)));
  assertEquals(2,persisted.size());
 }
 @Test void failedMutationDoesNotCacheAnInventedSuccessAndMissingKeyDoesNotMutate(){
  var s=service();String hash=s.fingerprint(Map.of("quote","q1"));
  assertThrows(BusinessException.class,()->s.execute(owner,"booking.create","request-1",hash,Result.class,()->{throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);}));
  assertTrue(persisted.isEmpty());
  assertThrows(BusinessException.class,()->s.execute(owner,"booking.create"," ",hash,Result.class,()->{fail("Invalid key must not mutate");return null;}));
 }
 @Test void equivalentMapOrderProducesTheSameStableRequestFingerprint(){
  var s=service();var left=new LinkedHashMap<String,Object>();left.put("quantity",2);left.put("quote","q");
  var right=new LinkedHashMap<String,Object>();right.put("quote","q");right.put("quantity",2);
  assertEquals(s.fingerprint(left),s.fingerprint(right));
 }
}
