package io.github.hienpham0344.stayfinder.common.idempotency;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
@Repository
public class IdempotencyLockRepository {
 private final NamedParameterJdbcTemplate jdbc;
 public IdempotencyLockRepository(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
 @Transactional(propagation=Propagation.MANDATORY)
 public void lock(UUID actor,String operation,String key){
  // Namespace/actor/operation/key form an unambiguous mutex, released with the
  // transaction. It does not lock an actor wallet when an ADMIN acts for a customer.
  long lockKey;
  try{lockKey=ByteBuffer.wrap(MessageDigest.getInstance("SHA-256").digest(
    ("stayfinder.idempotency.v1|"+actor+"|"+operation+"|"+key).getBytes(StandardCharsets.UTF_8))).getLong();}
  catch(NoSuchAlgorithmException e){throw new IllegalStateException("SHA-256 unavailable",e);}
  jdbc.query("select pg_catalog.pg_advisory_xact_lock(:lockKey)",Map.of("lockKey",lockKey),(ResultSetExtractor<Void>)row->null);
 }
}
