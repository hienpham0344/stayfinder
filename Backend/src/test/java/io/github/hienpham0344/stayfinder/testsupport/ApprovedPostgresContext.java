package io.github.hienpham0344.stayfinder.testsupport;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.transaction.*;import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.jdbc.datasource.DataSourceUtils;
import javax.sql.DataSource;import java.sql.*;import java.time.*;
@TestConfiguration(proxyBeanMethods=false)
public class ApprovedPostgresContext {
 @Bean @Primary MutableFixtureClock fixtureClock(){return new MutableFixtureClock();}
 @Bean SmartInitializingSingleton pinApprovedSchema(PlatformTransactionManager manager,DataSource dataSource){
  return ()->{
   if(!(manager instanceof AbstractPlatformTransactionManager tx))throw new IllegalStateException("Unsupported test transaction manager");
   tx.addListener(new TransactionExecutionListener(){
    @Override public void afterBegin(TransactionExecution transaction,Throwable failure){
     if(failure!=null)return;
     Connection c=DataSourceUtils.getConnection(dataSource);
     try(var s=c.createStatement()){
      s.execute("set local application_name=\'StayFinderIsolatedQA\'");
      s.execute("set local search_path=stayfinder_test_20261013,pg_catalog");// A complete booking holds its advisory mutex across multiple remote DB roundtrips.
      // Keep finite fixture-only bounds below the 45s worker/future budget.
      s.execute("set local statement_timeout='35s'");s.execute("set local lock_timeout='30s'");
      try(var r=s.executeQuery("select pg_backend_pid()")){r.next();TransactionBackendTracker.PIDS.put(Thread.currentThread().threadId(),r.getInt(1));}
      try(var r=s.executeQuery("select current_schema()")){r.next();if(!PostgresTestTarget.SCHEMA.equals(r.getString(1)))throw new IllegalStateException("Wrong PostgreSQL test schema");}
     }catch(SQLException e){throw new IllegalStateException("Cannot pin approved test transaction; SQLSTATE="+e.getSQLState());}
     finally{DataSourceUtils.releaseConnection(c,dataSource);}
    }
   });
  };
 }
}
