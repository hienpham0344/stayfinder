package io.github.hienpham0344.stayfinder.testsupport;
import org.springframework.context.*;
import org.springframework.boot.test.util.TestPropertyValues;
import java.nio.file.*;import java.io.*;import java.util.*;
/** Secrets stay in memory and local ignored env; the test target never falls through to public. */
public class ApprovedPostgresInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
 @Override public void initialize(ConfigurableApplicationContext context){
  try(var c=PostgresTestTarget.openRollbackOnly()){
   try(var s=c.createStatement();var r=s.executeQuery("select count(*) from information_schema.tables where table_schema='stayfinder_test_20261013' and table_type='BASE TABLE'")){
    r.next();if(r.getInt(1)!=35)throw new IllegalStateException("Approved transaction migrations required");
   }finally{c.rollback();}
  }catch(Exception e){throw new IllegalStateException("Approved PostgreSQL context preflight failed; no public fallback");}
  Properties env=new Properties();
  try(Reader r=Files.newBufferedReader(Path.of(System.getProperty("stayfinder.test.envFile")))){env.load(r);}
  catch(IOException e){throw new IllegalStateException("Cannot read local test configuration");}
  Map<String,String> p=new LinkedHashMap<>();
  p.put("spring.datasource.url",value(env,"SPRING_DATASOURCE_URL"));p.put("spring.datasource.username",value(env,"SPRING_DATASOURCE_USERNAME"));p.put("spring.datasource.password",value(env,"SPRING_DATASOURCE_PASSWORD"));
  p.put("spring.datasource.hikari.data-source-properties.prepareThreshold","0");p.put("spring.datasource.hikari.data-source-properties.currentSchema",PostgresTestTarget.SCHEMA);
  p.put("spring.datasource.hikari.maximum-pool-size","4");p.put("spring.datasource.hikari.minimum-idle","0");p.put("spring.datasource.hikari.connection-timeout","10000");
  p.put("spring.jpa.hibernate.ddl-auto","validate");p.put("spring.jpa.properties.hibernate.default_schema",PostgresTestTarget.SCHEMA);
  p.put("spring.config.import","");p.put("stayfinder.workers.enabled","false");
  p.put("spring.security.jwt.secret-base64","MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=");
  p.put("SEPAY_TEST_MODE","true");p.put("SEPAY_TEST_BANK_NAME","MBBank");p.put("SEPAY_TEST_BANK_CODE","MB");p.put("SEPAY_TEST_ACCOUNT_NUMBER","000123456789");
  p.put("SEPAY_TEST_ACCOUNT_HOLDER","Synthetic holder");p.put("SEPAY_TEST_SUB_ACCOUNT","");
  p.put("SEPAY_WEBHOOK_SECRET","fixture-only-sepay-hmac-secret-32bytes");
  p.put("logging.level.org.hibernate","ERROR");p.put("logging.level.com.zaxxer.hikari","WARN");
  TestPropertyValues.of(p).applyTo(context.getEnvironment());
 }
 private static String value(Properties p,String key){
  String s=p.getProperty(key,"").trim();if(s.length()>1&&((s.startsWith("\"")&&s.endsWith("\""))||(s.startsWith("'")&&s.endsWith("'"))))s=s.substring(1,s.length()-1);
  if(s.isBlank())throw new IllegalStateException("Missing local database setting");return s;
 }
}
