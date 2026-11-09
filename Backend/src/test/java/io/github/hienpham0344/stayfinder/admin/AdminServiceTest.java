package io.github.hienpham0344.stayfinder.admin;

import io.github.hienpham0344.stayfinder.admin.dto.AdminDtos.*;
import io.github.hienpham0344.stayfinder.admin.repository.AdminRepository;
import io.github.hienpham0344.stayfinder.admin.service.AdminService;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class AdminServiceTest {
    final AdminRepository rows=mock(AdminRepository.class);
    final Instant now=Instant.parse("2026-11-09T00:00:00Z");
    final AdminService service=new AdminService(rows,Clock.fixed(now,ZoneOffset.UTC));
    final UUID actor=UUID.randomUUID(),target=UUID.randomUUID();
    Account account(UUID id,String role,String state) { return new Account(id,"test@example.invalid","Test",role,state); }
    void administrator() { when(rows.lockAccount(actor)).thenReturn(Optional.of(account(actor,"admin","active"))); }
    @Test void refusesSelfDemotion() {
        administrator();
        assertThrows(BusinessException.class,()->service.access(actor,actor,new AccessChange(UserRole.CUSTOMER,true,"Change")));
        verify(rows,never()).updateAccess(any(),any(),any(),any());
    }
    @Test void refusesLastAdminRemoval() {
        administrator();when(rows.lockAccount(target)).thenReturn(Optional.of(account(target,"admin","active")));when(rows.activeAdmins()).thenReturn(1L);
        assertThrows(BusinessException.class,()->service.access(actor,target,new AccessChange(UserRole.CUSTOMER,true,"Change")));
        verify(rows,never()).updateAccess(any(),any(),any(),any());
    }
    @Test void staleAdministratorCannotMutateAccounts() {
        when(rows.lockAccount(actor)).thenReturn(Optional.of(account(actor,"customer","active")));
        assertThrows(BusinessException.class,()->service.access(actor,target,new AccessChange(UserRole.PARTNER,true,"Change")));
        verify(rows,never()).lockAccount(target);
    }
    @Test void accountDisableIsAuditedAndRevokesSessionsInRepository() {
        administrator();when(rows.lockAccount(target)).thenReturn(Optional.of(account(target,"customer","active")));
        service.access(actor,target,new AccessChange(UserRole.CUSTOMER,false,"Abuse confirmed"));
        var order=inOrder(rows);order.verify(rows).serializeAccessChanges();order.verify(rows).lockAccount(actor);order.verify(rows).lockAccount(target);
        order.verify(rows).updateAccess(target,"customer","disabled",now);order.verify(rows).audit(actor,"account_access",target.toString(),"Abuse confirmed",now);
    }
    @Test void pendingEnrollmentCannotBeEnabled() {
        administrator();when(rows.lockAccount(target)).thenReturn(Optional.of(account(target,"customer","pending_enrollment")));
        assertThrows(BusinessException.class,()->service.access(actor,target,new AccessChange(UserRole.PARTNER,true,"Change")));
        verify(rows,never()).updateAccess(any(),any(),any(),any());
    }
    @Test void completedReportCannotReopen() {
        when(rows.lockReport(target)).thenReturn(Optional.of("resolved"));
        assertThrows(BusinessException.class,()->service.report(actor,target,new ReportChange(ReportStatus.IN_REVIEW,"Reopen")));
        verify(rows,never()).updateReport(any(),any());
    }
    @Test void reportCanMoveToResolutionAndRecordsReason() {
        when(rows.lockReport(target)).thenReturn(Optional.of("in_review"));
        service.report(actor,target,new ReportChange(ReportStatus.RESOLVED,"Fixed"));
        verify(rows).updateReport(target,"resolved");verify(rows).audit(actor,"report_resolved",target.toString(),"Fixed",now);
    }
    @Test void reviewHidePersistsAndAudits() {
        when(rows.lockReview(target)).thenReturn(Optional.of(false));
        service.review(actor,target,new ReviewChange(true,"Spam"));
        verify(rows).moderateReview(target,true);verify(rows).audit(actor,"review_hidden",target.toString(),"Spam",now);
    }
    @Test void accommodationHideCannotBePublishedByPartnerAgain() {
        when(rows.lockAccommodation(target)).thenReturn(Optional.of("active"));
        service.accommodation(actor,target,new AccommodationChange(AccommodationDecision.HIDE,"Policy violation"));
        verify(rows).moderateAccommodation(target,"inactive");
    }
    @Test void invalidSettingsCannotReachPersistence() {
        assertThrows(BusinessException.class,()->service.setting(actor,SettingKey.SUPPORT_RESPONSE_HOURS,new SettingChange("0","Invalid")));
        assertThrows(BusinessException.class,()->service.setting(actor,SettingKey.SUPPORT_EMAIL,new SettingChange("secret-key","Invalid")));
        verifyNoInteractions(rows);
    }
    @Test void settingIsNormalizedAndAudited() {
        service.setting(actor,SettingKey.SUPPORT_RESPONSE_HOURS,new SettingChange("024","Response SLA"));
        verify(rows).setSetting("SUPPORT_RESPONSE_HOURS","24",actor,now);
        verify(rows).audit(actor,"setting_updated","SUPPORT_RESPONSE_HOURS","Response SLA",now);
    }
    @Test void paginationAndSearchAreBounded() {
        assertThrows(BusinessException.class,()->service.accounts(-1,20));
        assertThrows(BusinessException.class,()->service.accounts(0,101));
        assertThrows(BusinessException.class,()->service.accounts(Integer.MAX_VALUE,100));
        service.accounts(0,20,"PARTNER","A_%");
        verify(rows).accounts(0,20,"partner","%a!_!%%");
    }
}
