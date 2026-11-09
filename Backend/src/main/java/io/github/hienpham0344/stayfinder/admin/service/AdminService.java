package io.github.hienpham0344.stayfinder.admin.service;

import io.github.hienpham0344.stayfinder.admin.dto.AdminDtos.*;
import io.github.hienpham0344.stayfinder.admin.repository.AdminRepository;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.*;

@Service
@PreAuthorize("hasRole('ADMIN')")
@Transactional(readOnly=true)
public class AdminService {
    private final AdminRepository rows;
    private final Clock clock;
    public AdminService(AdminRepository rows,Clock clock) { this.rows=rows;this.clock=clock; }
    public Page<Account> accounts(int page,int size) { int offset=offset(page,size);return new Page<>(rows.accounts(offset,size),rows.accountCount(),page,size); }
    public Page<Account> accounts(int page,int size,String role,String query) {
        int offset=offset(page,size);String filter=role==null?"":role.toLowerCase(Locale.ROOT);
        if(!Set.of("","customer","partner","admin").contains(filter)||query==null||query.length()>200)throw invalid();
        String search="%"+query.trim().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%";
        return new Page<>(rows.accounts(offset,size,filter,search),rows.accountCount(filter,search),page,size);
    }
    public Account account(UUID id) { return rows.account(id).orElseThrow(()->new BusinessException(ErrorCode.USER_NOT_FOUND)); }
    public AccommodationDetail accommodation(UUID id) { return rows.accommodation(id).orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND)); }
    public Page<Report> reports(int page,int size) { int offset=offset(page,size);return new Page<>(rows.reports(offset,size),rows.reportCount(),page,size); }
    public Page<Content> accommodations(int page,int size) { int offset=offset(page,size);return new Page<>(rows.accommodations(offset,size),rows.accommodationCount(),page,size); }
    public Page<Content> reviews(int page,int size) { int offset=offset(page,size);return new Page<>(rows.reviews(offset,size),rows.reviewCount(),page,size); }
    public List<Setting> settings() { return rows.settings(); }

    @Transactional
    public void access(UUID actor,UUID target,AccessChange change) {
        reason(change.reason());
        if(change.role()==null||change.enabled()==null)throw invalid();
        rows.serializeAccessChanges();
        // Recheck the actor after acquiring the mutex: an older request may outlive a demotion.
        Account administrator=rows.lockAccount(actor).orElseThrow(()->new BusinessException(ErrorCode.FORBIDDEN));
        if(!"admin".equals(administrator.role())||!"active".equals(administrator.credentialState()))throw new BusinessException(ErrorCode.FORBIDDEN);
        Account account=rows.lockAccount(target).orElseThrow(()->new BusinessException(ErrorCode.USER_NOT_FOUND));
        String role=change.role().getValue();
        if(actor.equals(target)&&(!change.enabled()||!"admin".equals(role)))throw new BusinessException(ErrorCode.FORBIDDEN);
        // Pending enrollment must never be enabled through an administrative role edit.
        if(!Set.of("active","disabled").contains(account.credentialState()))throw invalid();
        if("admin".equals(account.role())&&"active".equals(account.credentialState())&&(!change.enabled()||!"admin".equals(role))&&rows.activeAdmins()<=1)throw new BusinessException(ErrorCode.FORBIDDEN);
        rows.updateAccess(target,role,change.enabled()?"active":"disabled",clock.instant());
        audit(actor,"account_access",target.toString(),change.reason());
    }
    @Transactional
    public void report(UUID actor,UUID id,ReportChange change) {
        reason(change.reason());if(change.status()==null)throw invalid();
        String state=rows.lockReport(id).orElseThrow(()->new BusinessException(ErrorCode.VALIDATION_ERROR));
        String next=change.status().name().toLowerCase(Locale.ROOT);
        if(state.equals(next))return;
        if(!"submitted".equals(state)&&!"in_review".equals(state))throw invalid();
        rows.updateReport(id,next);audit(actor,"report_"+next,id.toString(),change.reason());
    }
    @Transactional
    public void accommodation(UUID actor,UUID id,AccommodationChange change) {
        reason(change.reason());if(change.decision()==null)throw invalid();
        rows.lockAccommodation(id).orElseThrow(()->new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        rows.moderateAccommodation(id,change.decision()==AccommodationDecision.APPROVE?"active":"inactive");
        audit(actor,"accommodation_"+change.decision().name().toLowerCase(Locale.ROOT),id.toString(),change.reason());
    }
    @Transactional
    public void review(UUID actor,UUID id,ReviewChange change) {
        reason(change.reason());if(change.hidden()==null)throw invalid();
        rows.lockReview(id).orElseThrow(()->new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        rows.moderateReview(id,change.hidden());audit(actor,change.hidden()?"review_hidden":"review_visible",id.toString(),change.reason());
    }
    @Transactional
    public void setting(UUID actor,SettingKey key,SettingChange change) {
        reason(change.reason());String value=change.value()==null?"":change.value().trim();
        if(key==null||value.isBlank()||value.length()>200)throw invalid();
        switch(key) {
            case SUPPORT_EMAIL -> { if(!value.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw invalid(); }
            case SUPPORT_RESPONSE_HOURS -> { if(!value.matches("[0-9]{1,3}"))throw invalid();int hours=Integer.parseInt(value);if(hours<1||hours>168)throw invalid();value=Integer.toString(hours); }
        }
        rows.setSetting(key.name(),value,actor,clock.instant());audit(actor,"setting_updated",key.name(),change.reason());
    }
    private void audit(UUID actor,String action,String target,String reason) { rows.audit(actor,action,target,reason.trim(),clock.instant()); }
    private static void reason(String value) { if(value==null||value.isBlank()||value.length()>500||value.chars().anyMatch(Character::isISOControl))throw invalid(); }
    private static int offset(int page,int size) { if(page<0||size<1||size>100||page>Integer.MAX_VALUE/size)throw invalid();return page*size; }
    private static BusinessException invalid() { return new BusinessException(ErrorCode.VALIDATION_ERROR); }
}
