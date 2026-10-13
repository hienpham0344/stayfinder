package io.github.hienpham0344.stayfinder.testsupport;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.util.Properties;

// Opt-in only. No test can fall through to public, create/reset a schema, or commit this fixture transaction.
public final class PostgresTestTarget {
 public static final String SCHEMA="stayfinder_test_20261013";
 private PostgresTestTarget(){}
 public static Connection openRollbackOnly() throws Exception {
  if(!SCHEMA.equals(System.getProperty("stayfinder.test.schema"))
      ||!"true".equals(System.getProperty("stayfinder.test.approved")))
   throw new IllegalStateException("PostgreSQL tests require explicitly approved exact test schema");
  String envFile=System.getProperty("stayfinder.test.envFile");
  if(envFile==null||envFile.isBlank())throw new IllegalStateException("Provide local envFile path; never put credentials in command arguments");
  Properties cfg=new Properties();try(Reader r=Files.newBufferedReader(Path.of(envFile))){cfg.load(r);}
  Properties login=new Properties();login.setProperty("user",value(cfg,"SPRING_DATASOURCE_USERNAME"));
  login.setProperty("password",value(cfg,"SPRING_DATASOURCE_PASSWORD"));login.setProperty("currentSchema",SCHEMA);
  login.setProperty("connectTimeout","10");login.setProperty("socketTimeout","30");login.setProperty("ApplicationName","StayFinderIsolatedTest");
  DriverManager.setLoginTimeout(10);
  Connection c;
  try{c=DriverManager.getConnection(value(cfg,"SPRING_DATASOURCE_URL"),login);}
  catch(SQLException e){throw new IllegalStateException("Test connection failed; SQLSTATE="+e.getSQLState());}
  try{
   c.setAutoCommit(false);
   try(Statement s=c.createStatement()){
    s.execute("set local search_path="+SCHEMA+",pg_catalog");s.execute("set local lock_timeout='5s'");
    s.execute("set local statement_timeout='15s'");
    try(ResultSet r=s.executeQuery("select current_schema()")){r.next();if(!SCHEMA.equals(r.getString(1)))throw new IllegalStateException("Wrong test schema");}
   }
   return c;
  }catch(Exception e){c.rollback();c.close();throw e;}
 }
 private static String value(Properties p,String key){
  String s=p.getProperty(key,"").trim();
  if(s.length()>1&&((s.startsWith("\"")&&s.endsWith("\""))||(s.startsWith("'")&&s.endsWith("'"))))s=s.substring(1,s.length()-1);
  if(s.isBlank())throw new IllegalStateException("Missing local database setting");
  return s;
 }
}
