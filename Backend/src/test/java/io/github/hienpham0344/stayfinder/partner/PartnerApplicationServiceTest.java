package io.github.hienpham0344.stayfinder.partner;

import io.github.hienpham0344.stayfinder.audit.service.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.ManagementUserRepository;
import io.github.hienpham0344.stayfinder.partner.entity.PartnerApplication;
import io.github.hienpham0344.stayfinder.partner.repository.PartnerApplicationRepository;
import io.github.hienpham0344.stayfinder.partner.service.PartnerApplicationService;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PartnerApplicationServiceTest {
    private final PartnerApplicationRepository applications = mock(PartnerApplicationRepository.class);
    private final ManagementUserRepository users = mock(ManagementUserRepository.class);
    private final AuditService audit = mock(AuditService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-16T00:00:00Z"), ZoneOffset.UTC);
    private final PartnerApplicationService service = new PartnerApplicationService(applications, users,
            Mappers.getMapper(ManagementMapper.class), audit, clock);

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    @Test
    void pendingSubmissionIsIdempotent() {
        User applicant = applicant();
        login(applicant.getId(), UserRole.CUSTOMER);
        PartnerApplication application = application(applicant.getId());
        when(users.lockById(applicant.getId())).thenReturn(Optional.of(applicant));
        when(applications.lockByUserId(applicant.getId())).thenReturn(Optional.of(application));

        var result = service.submit(new ManagementRequests.PartnerApplicationRequest("Changed", "Changed"));

        assertEquals(application.getId(), result.id());
        assertEquals("Business", result.businessName());
        verify(applications, never()).saveAndFlush(any());
        verifyNoInteractions(audit);
    }

    @Test
    void approvalGrantsPartnerOnceAndReplayNeverRegrantsRevokedRole() {
        User applicant = applicant();
        PartnerApplication application = application(applicant.getId());
        UUID administrator = UUID.randomUUID();
        login(administrator, UserRole.ADMIN);
        when(applications.findUserIdById(application.getId())).thenReturn(Optional.of(applicant.getId()));
        when(users.lockById(applicant.getId())).thenReturn(Optional.of(applicant));
        when(applications.lockByUserId(applicant.getId())).thenReturn(Optional.of(application));
        when(applications.saveAndFlush(application)).thenReturn(application);
        var request = new ManagementRequests.Decision(true, "verified", 0L);

        var approved = service.decide(application.getId(), request);

        assertEquals(PartnerApplication.Status.APPROVED, approved.status());
        assertEquals(administrator, approved.reviewedBy());
        assertEquals(clock.instant(), approved.reviewedAt());
        assertEquals(UserRole.PARTNER, applicant.getRole());
        assertEquals(1L, applicant.getAuthVersion());

        // A later administrator may revoke partner access. Replaying the old decision
        // must return its existing result rather than grant access a second time.
        applicant.setRole(UserRole.CUSTOMER);
        service.decide(application.getId(), request);
        assertEquals(UserRole.CUSTOMER, applicant.getRole());
        assertEquals(1L, applicant.getAuthVersion());
        verify(users, times(1)).save(applicant);
        verify(audit, times(1)).record(administrator, "PARTNER_APPLICATION_APPROVED", "partner_application",
                application.getId(), "verified");
    }

    private User applicant() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(UserRole.CUSTOMER);
        return user;
    }

    private PartnerApplication application(UUID userId) {
        PartnerApplication application = new PartnerApplication();
        application.setId(UUID.randomUUID());
        application.setUserId(userId);
        application.setBusinessName("Business");
        application.setDescription("Description");
        application.setStatus(PartnerApplication.Status.PENDING);
        application.setCreatedAt(clock.instant());
        return application;
    }

    private void login(UUID id, UserRole role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(id, "test@example.invalid", role), null, List.of()));
    }
}
