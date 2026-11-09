package io.github.hienpham0344.stayfinder.admin.repository;

import io.github.hienpham0344.stayfinder.admin.dto.AdminDtos.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.*;

/** SQL persistence only. Every write is coordinated by the transactional service. */
@Repository
public class AdminRepository {
    private final JdbcTemplate jdbc;
    public AdminRepository(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    public List<Account> accounts(int offset,int size) {
        return jdbc.query("select id,email,full_name,role,credential_state from users order by created_at,id limit ? offset ?",
            (r,n)->new Account(r.getObject("id",UUID.class),r.getString("email"),r.getString("full_name"),r.getString("role"),r.getString("credential_state")),size,offset);
    }
    public long accountCount() { return jdbc.queryForObject("select count(*) from users",Long.class); }
    public List<Account> accounts(int offset,int size,String role,String search) {
        return jdbc.query("select id,email,full_name,role,credential_state from users where (?='' or role=?) and (lower(email) like ? escape '!' or lower(coalesce(full_name,'')) like ? escape '!') order by created_at,id limit ? offset ?",
            (r,n)->new Account(r.getObject("id",UUID.class),r.getString("email"),r.getString("full_name"),r.getString("role"),r.getString("credential_state")),role,role,search,search,size,offset);
    }
    public long accountCount(String role,String search) { return jdbc.queryForObject("select count(*) from users where (?='' or role=?) and (lower(email) like ? escape '!' or lower(coalesce(full_name,'')) like ? escape '!')",Long.class,role,role,search,search); }
    public Optional<Account> account(UUID id) {
        return jdbc.query("select id,email,full_name,role,credential_state from users where id=?",
            (r,n)->new Account(r.getObject("id",UUID.class),r.getString("email"),r.getString("full_name"),r.getString("role"),r.getString("credential_state")),id).stream().findFirst();
    }
    public void serializeAccessChanges() {
        // A transaction-scoped mutex serializes last-admin decisions across application instances.
        jdbc.query("select pg_advisory_xact_lock(72460311)", r -> { while(r.next()) { /* acquire lock */ } });
    }
    public Optional<Account> lockAccount(UUID id) {
        return jdbc.query("select id,email,full_name,role,credential_state from users where id=? for update",
            (r,n)->new Account(r.getObject("id",UUID.class),r.getString("email"),r.getString("full_name"),r.getString("role"),r.getString("credential_state")),id).stream().findFirst();
    }
    public long activeAdmins() { return jdbc.queryForObject("select count(*) from users where role='admin' and credential_state='active'",Long.class); }
    public void updateAccess(UUID id,String role,String state,Instant now) {
        jdbc.update("update users set role=?,credential_state=? where id=?",role,state,id);
        jdbc.update("update auth_sessions set revoked_at=? where user_id=? and revoked_at is null",java.sql.Timestamp.from(now),id);
    }
    public List<Report> reports(int offset,int size) {
        return jdbc.query("select id,user_id,booking_id,category,description,status,created_at from support_reports order by created_at desc,id limit ? offset ?",
            (r,n)->new Report(r.getObject("id",UUID.class),r.getObject("user_id",UUID.class),r.getObject("booking_id",UUID.class),r.getString("category"),r.getString("description"),r.getString("status"),r.getTimestamp("created_at").toInstant()),size,offset);
    }
    public long reportCount() { return jdbc.queryForObject("select count(*) from support_reports",Long.class); }
    public Optional<String> lockReport(UUID id) { return jdbc.query("select status from support_reports where id=? for update",(r,n)->r.getString(1),id).stream().findFirst(); }
    public void updateReport(UUID id,String state) { jdbc.update("update support_reports set status=? where id=?",state,id); }
    public List<Content> accommodations(int offset,int size) {
        return jdbc.query("select id,name,status from accommodations order by created_at,id limit ? offset ?",(r,n)->new Content(r.getObject(1,UUID.class),r.getString(2),r.getString(3)),size,offset);
    }
    public long accommodationCount() { return jdbc.queryForObject("select count(*) from accommodations",Long.class); }
    public Optional<String> lockAccommodation(UUID id) { return jdbc.query("select status from accommodations where id=? for update",(r,n)->r.getString(1),id).stream().findFirst(); }
    public void moderateAccommodation(UUID id,String status) { jdbc.update("update accommodations set status=?,moderation_blocked=? where id=?",status,!"active".equals(status),id); }
    public Optional<AccommodationDetail> accommodation(UUID id) {
        return jdbc.query("select id,partner_id,name,address,description,status,moderation_blocked from accommodations where id=?",
            (r,n)->new AccommodationDetail(r.getObject(1,UUID.class),r.getObject(2,UUID.class),r.getString(3),r.getString(4),r.getString(5),r.getString(6),r.getBoolean(7)),id).stream().findFirst();
    }
    public List<Content> reviews(int offset,int size) {
        return jdbc.query("select id,comment,case when hidden then 'hidden' else 'visible' end from reviews order by created_at desc,id limit ? offset ?",(r,n)->new Content(r.getObject(1,UUID.class),r.getString(2),r.getString(3)),size,offset);
    }
    public long reviewCount() { return jdbc.queryForObject("select count(*) from reviews",Long.class); }
    public Optional<Boolean> lockReview(UUID id) { return jdbc.query("select hidden from reviews where id=? for update",(r,n)->r.getBoolean(1),id).stream().findFirst(); }
    public void moderateReview(UUID id,boolean hidden) { jdbc.update("update reviews set hidden=? where id=?",hidden,id); }
    public List<Setting> settings() { return jdbc.query("select setting_key,setting_value from system_settings order by setting_key",(r,n)->new Setting(r.getString(1),r.getString(2))); }
    public void setSetting(String key,String value,UUID actor,Instant now) {
        jdbc.update("insert into system_settings(setting_key,setting_value,updated_by,updated_at) values (?,?,?,?) on conflict(setting_key) do update set setting_value=excluded.setting_value,updated_by=excluded.updated_by,updated_at=excluded.updated_at",key,value,actor,java.sql.Timestamp.from(now));
    }
    public void audit(UUID actor,String action,String target,String reason,Instant now) {
        jdbc.update("insert into admin_audit_events(id,actor_id,action,target,reason,created_at) values (?,?,?,?,?,?)",UUID.randomUUID(),actor,action,target,reason,java.sql.Timestamp.from(now));
    }
}
