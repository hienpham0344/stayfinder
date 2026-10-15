package io.github.hienpham0344.stayfinder.common.idempotency;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Clock;
import java.util.*;
import java.util.function.Supplier;
@Service
public class IdempotencyService {
 private final IdempotencyRepository records;private final UserRepository users;private final JsonMapper mapper;private final Clock clock;private final IdempotencyLockRepository keyLocks;
 public IdempotencyService(IdempotencyRepository records,UserRepository users,IdempotencyLockRepository keyLocks,JsonMapper mapper,Clock clock){
  this.records=records;this.users=users;this.clock=clock;this.keyLocks=keyLocks;
  this.mapper=mapper.rebuild().enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY).enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS).build();
 }
 public String fingerprint(Object payload){
  try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(mapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8)));}
  catch(NoSuchAlgorithmException|RuntimeException e){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
 }
 @Transactional
 public <T> T execute(UUID userId,String operation,String key,String requestHash,Class<T> resultType,Supplier<T> mutation){
  if(userId==null||operation==null||!operation.matches("[a-z][a-z0-9_./:-]{0,63}")||
      key==null||!key.matches("[A-Za-z0-9._:-]{1,128}")||requestHash==null||!requestHash.matches("[a-f0-9]{64}")||resultType==null||mutation==null)
   throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  // Validate the authenticated actor without acquiring a different user's
  // wallet mutex. Domain mutations acquire the affected owner wallet first.
  var owner=users.findById(userId).orElseThrow(()->new BusinessException(ErrorCode.USER_NOT_FOUND));
  if(!"active".equals(owner.getCredentialState()))throw new BusinessException(ErrorCode.UNAUTHORIZED);
  keyLocks.lock(userId,operation,key);
  var existing=records.findByUserIdAndOperationAndRequestKey(userId,operation,key);
  if(existing.isPresent()){
   var row=existing.get();
   if(!requestHash.equals(row.getRequestHash()))throw new BusinessException(ErrorCode.IDEMPOTENCY_CONFLICT);
   if(!resultType.getName().equals(row.getResultType()))throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
   try{return mapper.readValue(row.getResultJson(),resultType);}
   catch(RuntimeException e){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
  }
  T result=mutation.get();
  String json;
  try{json=mapper.writeValueAsString(result);}
  catch(RuntimeException e){throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
  var row=new IdempotencyRecord();row.setId(UUID.randomUUID());row.setUserId(userId);row.setOperation(operation);row.setRequestKey(key);
  row.setRequestHash(requestHash);row.setResultType(resultType.getName());row.setResultJson(json);row.setCreatedAt(clock.instant());
  records.save(row);
  return result;
 }
}
