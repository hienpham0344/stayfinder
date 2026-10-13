package io.github.hienpham0344.stayfinder.common;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyLockRepository;
import io.github.hienpham0344.stayfinder.testsupport.PostgresTestTarget;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import java.sql.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@Tag("postgres")
class ApprovedSchemaPostgresIntegrationTest {
 @Test void normalizedIdentityFavoriteAndLedgerConstraintsRejectDuplicates() throws Exception {
  try(var c=PostgresTestTarget.openRollbackOnly()){
   try{
    UUID owner=UUID.randomUUID(),stay=UUID.randomUUID(),source=UUID.randomUUID();
    execute(c,"insert into users(id,email,role) values(?,?,'customer')",owner,"fixture-"+owner+"@example.test");
    rejectUnique(c,"insert into users(id,email,role) values(?,?,'customer')",UUID.randomUUID()," FIXTURE-"+owner+"@EXAMPLE.TEST ");
    execute(c,"insert into accommodations(id,name,status) values(?,'Synthetic constraint stay','active')",stay);
    execute(c,"insert into favorites(id,user_id,accommodation_id) values(?,?,?)",UUID.randomUUID(),owner,stay);
    rejectUnique(c,"insert into favorites(id,user_id,accommodation_id) values(?,?,?)",UUID.randomUUID(),owner,stay);
    String ledger="insert into reward_ledger_entries(id,user_id,kind,delta_points,source_type,source_id,source_key,balance_after,created_at,title) values(?,?,'earn',1,'booking',?,'earn:fixture',1,now(),'Synthetic ledger')";
    execute(c,ledger,UUID.randomUUID(),owner,source);
    rejectUnique(c,ledger,UUID.randomUUID(),owner,source);
   }finally{c.rollback();}
  }
 }
 @Test void productionAdvisoryMutexSerializesSameKeyAndReleasesOnRollback() throws Exception {
  try(var first=PostgresTestTarget.openRollbackOnly();var second=PostgresTestTarget.openRollbackOnly()){
   var one=new IdempotencyLockRepository(new NamedParameterJdbcTemplate(new SingleConnectionDataSource(first,true)));
   var two=new IdempotencyLockRepository(new NamedParameterJdbcTemplate(new SingleConnectionDataSource(second,true)));
   int waitingPid;try(var s=second.createStatement();var r=s.executeQuery("select pg_backend_pid()")){r.next();waitingPid=r.getInt(1);}
   UUID actor=UUID.randomUUID();one.lock(actor,"fixture:test","same-key");
   ExecutorService executor=Executors.newSingleThreadExecutor();
   CountDownLatch starting=new CountDownLatch(1);
   try{
    Future<?> waiting=executor.submit(()->{starting.countDown();two.lock(actor,"fixture:test","same-key");});
    assertTrue(starting.await(2,TimeUnit.SECONDS));
    assertThrows(TimeoutException.class,()->waiting.get(200,TimeUnit.MILLISECONDS));
    // PostgreSQL must actually report the second transaction waiting on an advisory lock.
    long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(2);boolean blocked=false;
    while(System.nanoTime()<deadline){
     try(var s=first.prepareStatement("select count(*) from pg_locks where locktype='advisory' and not granted and pid=?")){s.setInt(1,waitingPid);try(var r=s.executeQuery()){r.next();blocked=r.getLong(1)>0;}}
     if(blocked)break;Thread.sleep(20);
    }
    assertTrue(blocked,"The same-key transaction must wait on its actual PostgreSQL advisory mutex");
    first.rollback();waiting.get(3,TimeUnit.SECONDS);
   }finally{first.rollback();second.rollback();executor.shutdownNow();assertTrue(executor.awaitTermination(3,TimeUnit.SECONDS));}
  }
 }
 private static void execute(Connection c,String sql,Object... params)throws SQLException{
  try(var s=c.prepareStatement(sql)){for(int i=0;i<params.length;i++)s.setObject(i+1,params[i]);s.executeUpdate();}
 }
 private static void rejectUnique(Connection c,String sql,Object... params)throws SQLException{
  Savepoint save=c.setSavepoint();
  try{SQLException error=assertThrows(SQLException.class,()->execute(c,sql,params));assertEquals("23505",error.getSQLState());}
  finally{c.rollback(save);c.releaseSavepoint(save);}
 }
}
