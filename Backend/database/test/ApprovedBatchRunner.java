import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.io.Reader;
import java.sql.*;
import java.security.MessageDigest;
import java.util.*;

/** Executes only the frozen, explicitly approved G2 test-schema batch. Never resets a schema. */
public class ApprovedBatchRunner {
 private static final String TARGET="stayfinder_test_20261013";
 private static final String[] FILES={
  "Backend/database/test/000_test_schema_bootstrap.sql",
  "Backend/database/migrations/001_spring_identity.sql",
  "Backend/database/migrations/002_catalog_inventory_metadata.sql",
  "Backend/database/migrations/003_favorite_uniqueness.sql",
  "Backend/database/migrations/004_rewards_idempotency_audit.sql"
 };
 private static final String[] HASHES={
  "ef43115f5f6bf5ce15aef8fa001258e189496db1c98cc37f7486dc3d1d8e6976",
  "b92bf74b329a0582a0ceed9f93b02a89381c5d68faf2ae2e3a98fb74ce505ef2",
  "135f29f4fa159dbe5139f3e452d2e4e00489e002629fb2b3c7c9212926cfbb22",
  "eaff47e771b2c370fa045f09597429beed9c35f2443e2e2cc3edff4d3d36e016",
  "531891f3afe91a0cdf976243037f5d4bfb6ed9cf0104edf2499aab3f1feaf74c"
 };
 private static final String[] TRANSACTION_FILES={"Backend/database/migrations/005_quotes_snapshots_booking.sql","Backend/database/migrations/006_payments_events_refunds.sql"};
 private static final String[] TRANSACTION_HASHES={"f416c78c57da514ff54a2a1e64c8462d1f85ffbe4a473f28b15557216eb64eb7","8291b67e7c46aa33d695aa1e1e467ba33a49ad98e5a34aea43bc8d7f0d8d2835"};
 private static final String[] EXPERIENCE_FILES={"Backend/database/migrations/007_reviews_media.sql","Backend/database/migrations/008_preferences_reports.sql","Backend/database/migrations/009_notifications.sql"};
 private static final String[] EXPERIENCE_HASHES={"556a1eb319642529a35b2e43c3cc587252a951f88ddd8044b88645c96342b7bb","a24e9a5a5d6b016e27aa526cee7df2587b4bf5f8c0270f0fe52ff17a672cd21f","c15f5c86b282425aa98f6b790e6da8ce7d65cb1f1cb1f6502b7e0283cd95250d"};
 private static String hash(String input)throws Exception {
  return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8)));
 }
 private static String normalized(Path file)throws Exception{return Files.readString(file,StandardCharsets.UTF_8).replace("\r\n","\n");}
 private static String env(Properties p,String key){
  String s=p.getProperty(key,"").trim();
  if(s.length()>1&&((s.startsWith("\"")&&s.endsWith("\""))||(s.startsWith("'")&&s.endsWith("'"))))s=s.substring(1,s.length()-1);
  if(s.isBlank())throw new IllegalArgumentException("Missing database configuration");
  return s;
 }
 private static void searchPath(Connection c,String schema)throws SQLException{
  try(PreparedStatement s=c.prepareStatement("select set_config('search_path',?,true)")){s.setString(1,schema+",pg_catalog");s.execute();}
 }
 private static String fingerprintPublic(Connection c)throws Exception{
  searchPath(c,"public");
  StringBuilder result=new StringBuilder();
  String[] queries={
   "select table_name,column_name,data_type,udt_name,is_nullable,coalesce(column_default,'') from information_schema.columns where table_schema='public' order by table_name,ordinal_position",
   "select t.relname,k.conname,pg_get_constraintdef(k.oid) from pg_constraint k join pg_class t on t.oid=k.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' order by t.relname,k.conname",
   "select tablename,indexname,indexdef from pg_indexes where schemaname='public' order by tablename,indexname",
   "select t.relname,t.relrowsecurity,t.relforcerowsecurity from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relkind='r' order by t.relname",
   "select table_name,grantee,privilege_type from information_schema.table_privileges where table_schema='public' order by table_name,grantee,privilege_type"
  };
  for(String query:queries)try(Statement s=c.createStatement();ResultSet r=s.executeQuery(query)){
   while(r.next()){for(int i=1;i<=r.getMetaData().getColumnCount();i++)result.append(r.getString(i)).append('\u001f');result.append('\n');}
  }
  List<String> tables=new ArrayList<>();
  try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name")){while(r.next())tables.add(r.getString(1));}
  for(String table:tables)try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select count(*) from public.\""+table.replace("\"","\"\"")+"\"")){
   r.next();result.append(table).append('|').append(r.getLong(1)).append('\n');
  }
  return hash(result.toString());
 }
 private static void verifyTarget(Connection c,int expectedTables)throws SQLException{
  searchPath(c,TARGET);
  try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select current_schema()")){r.next();if(!TARGET.equals(r.getString(1)))throw new SQLException("Unexpected target","SF001");}
  List<String> tables=new ArrayList<>();
  try(PreparedStatement s=c.prepareStatement("select table_name from information_schema.tables where table_schema=? and table_type='BASE TABLE' order by table_name")){
   s.setString(1,TARGET);try(ResultSet r=s.executeQuery()){while(r.next())tables.add(r.getString(1));}
  }
  if(tables.size()!=expectedTables)throw new SQLException("Unexpected table count","SF002");
  for(String table:tables)try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select count(*) from "+TARGET+".\""+table.replace("\"","\"\"")+"\"")){r.next();if(r.getLong(1)!=0)throw new SQLException("Unexpected data","SF003");}
  try(PreparedStatement s=c.prepareStatement("select count(*) from pg_constraint k join pg_class t on t.oid=k.conrelid join pg_namespace n on n.oid=t.relnamespace join pg_class rt on rt.oid=k.confrelid join pg_namespace rn on rn.oid=rt.relnamespace where n.nspname=? and k.contype='f' and rn.nspname<>?")){
   s.setString(1,TARGET);s.setString(2,TARGET);try(ResultSet r=s.executeQuery()){r.next();if(r.getLong(1)!=0)throw new SQLException("External foreign key","SF004");}
  }
  try(PreparedStatement s=c.prepareStatement("select count(*) from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname=? and t.relkind='r' and not t.relrowsecurity")){
   s.setString(1,TARGET);try(ResultSet r=s.executeQuery()){r.next();if(r.getLong(1)!=0)throw new SQLException("Missing RLS","SF005");}
  }
  try(PreparedStatement s=c.prepareStatement("select count(*) from pg_namespace n cross join lateral aclexplode(n.nspacl) a left join pg_roles r on r.oid=a.grantee where n.nspname=? and a.privilege_type='USAGE' and (a.grantee=0 or r.rolname in ('anon','authenticated'))")){
   s.setString(1,TARGET);try(ResultSet r=s.executeQuery()){r.next();if(r.getLong(1)!=0)throw new SQLException("Client schema usage","SF006");}
  }
  System.out.println("TARGET_VERIFIED|"+TARGET+"|tables="+expectedTables+"|rows=0|external_fks=0|rls=all|direct_client_usage=none");
 }
 public static void main(String[] args){
  String stage="checksum";int applied=0;
  try{
   if(args.length!=3||(!"--approved-g2-20261013".equals(args[2])&&!"--approved-g2-transactions-20261013".equals(args[2])&&!"--approved-g2-experience-20261013".equals(args[2])&&!"--verify-g2-experience-20261013".equals(args[2])))throw new IllegalArgumentException("Explicit batch approval required");
   boolean transactionBatch="--approved-g2-transactions-20261013".equals(args[2]);
   boolean verifyOnly="--verify-g2-experience-20261013".equals(args[2]);
   boolean experienceBatch=verifyOnly||"--approved-g2-experience-20261013".equals(args[2]);
   String[] selectedFiles=experienceBatch?EXPERIENCE_FILES:transactionBatch?TRANSACTION_FILES:FILES,selectedHashes=experienceBatch?EXPERIENCE_HASHES:transactionBatch?TRANSACTION_HASHES:HASHES;
   Path root=Path.of(args[1]).toRealPath();
   List<String> sql=new ArrayList<>();StringBuilder expectedManifest=new StringBuilder();
   for(int i=0;i<selectedFiles.length;i++){
    Path p=root.resolve(selectedFiles[i]).toRealPath();if(!p.startsWith(root))throw new IllegalArgumentException("Path outside worktree");
    String source=normalized(p);if(!selectedHashes[i].equals(hash(source)))throw new IllegalArgumentException("Frozen checksum changed");
    sql.add(source);expectedManifest.append(selectedHashes[i]).append("  ").append(selectedFiles[i]).append('\n');
   }
   if(!normalized(root.resolve("Backend/database/test/"+(experienceBatch?"g2-experience-2026-10-13.sha256":transactionBatch?"g2-transactions-2026-10-13.sha256":"g2-batch-2026-10-13.sha256"))).equals(expectedManifest.toString()))throw new IllegalArgumentException("Manifest changed");
   System.out.println("CHECKSUMS_VERIFIED|files="+selectedFiles.length+"|target="+TARGET);
   if(verifyOnly){System.out.println("VERIFY_ONLY|no_env_read|no_database_connection|no_mutation");return;}
   Properties cfg=new Properties();try(Reader r=Files.newBufferedReader(Path.of(args[0]),StandardCharsets.UTF_8)){cfg.load(r);}
   Properties login=new Properties();login.setProperty("user",env(cfg,"SPRING_DATASOURCE_USERNAME"));login.setProperty("password",env(cfg,"SPRING_DATASOURCE_PASSWORD"));
   login.setProperty("prepareThreshold","0");login.setProperty("connectTimeout","10");login.setProperty("socketTimeout","45");login.setProperty("ApplicationName","StayFinderApprovedG2TestBatch");DriverManager.setLoginTimeout(10);
   stage="connect";
   try(Connection c=DriverManager.getConnection(env(cfg,"SPRING_DATASOURCE_URL"),login)){
    try{
     c.unwrap(org.postgresql.PGConnection.class).setPrepareThreshold(0);
     c.setAutoCommit(false);
     try(Statement s=c.createStatement()){s.execute("set statement_timeout='30s'");s.execute("set lock_timeout='5s'");}
     stage="preflight";
     try(PreparedStatement s=c.prepareStatement("select exists(select 1 from pg_namespace where nspname=?)")){
      s.setString(1,TARGET);try(ResultSet r=s.executeQuery()){r.next();if(r.getBoolean(1)!=(transactionBatch||experienceBatch))throw new SQLException("Unexpected target existence; reset forbidden","SF007");}
     }
     if(experienceBatch){
      verifyTarget(c,35);
      try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select count(*) from information_schema.tables where table_schema='stayfinder_test_20261013' and table_name in ('media_assets','user_preferences','support_reports','notifications','notification_inbox_state')")){r.next();if(r.getInt(1)!=0)throw new SQLException("Experience already present; reset forbidden","SF010");}
     }
     if(transactionBatch){
      verifyTarget(c,31);
      try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select count(*) from information_schema.tables where table_schema=\'stayfinder_test_20261013\' and table_name in (\'booking_quotes\',\'outbox_events\',\'payment_webhook_events\',\'refund_requests\')")){r.next();if(r.getInt(1)!=0)throw new SQLException("Transactions already present; reset forbidden","SF009");}
     }
     String before=fingerprintPublic(c);c.rollback();
     for(int i=0;i<selectedFiles.length;i++){
      stage=selectedFiles[i];
      // SET LOCAL and the reviewed script share one pinned transaction even through transaction pooling.
      try(PreparedStatement s=c.prepareStatement("select set_config('stayfinder.target_schema',?,true)")){s.setString(1,TARGET);s.execute();}
      searchPath(c,TARGET);
      try(Statement s=c.createStatement()){s.execute(sql.get(i));}
      applied++;System.out.println("APPLIED|"+selectedFiles[i]);
     }
     stage="verify";verifyTarget(c,experienceBatch?40:transactionBatch?35:31);
     String after=fingerprintPublic(c);if(!before.equals(after))throw new SQLException("Public fingerprint differs; investigate concurrent changes","SF008");
     System.out.println("PUBLIC_UNCHANGED|metadata_and_counts_sha256="+after);
     c.rollback();System.out.println("G2_BATCH_COMPLETE|committed_scripts="+applied);
    }catch(Exception e){try(Statement s=c.createStatement()){s.execute("rollback");}catch(SQLException ignored){}throw e;}
   }
  }catch(Exception e){
   System.err.println("G2_BATCH_FAILED|stage="+stage+"|class="+e.getClass().getSimpleName()+"|sqlstate="+(e instanceof SQLException s?s.getSQLState():"configuration")+"|committed_scripts="+applied);
   System.exit(1);
  }
 }
}
