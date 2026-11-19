package io.github.hienpham0344.stayfinder.partner.service;

import io.github.hienpham0344.stayfinder.audit.service.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.ManagementUserRepository;
import io.github.hienpham0344.stayfinder.management.service.ManagementPages;
import io.github.hienpham0344.stayfinder.management.service.ManagementValidation;
import io.github.hienpham0344.stayfinder.partner.entity.PartnerApplication;
import io.github.hienpham0344.stayfinder.partner.repository.PartnerApplicationRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

@Service
public class PartnerApplicationService {
    private final PartnerApplicationRepository applications;
    private final ManagementUserRepository users;
    private final ManagementMapper mapper;
    private final AuditService audit;
    private final Clock clock;

    public PartnerApplicationService(PartnerApplicationRepository applications, ManagementUserRepository users,
                                     ManagementMapper mapper, AuditService audit, Clock clock) {
        this.applications = applications;
        this.users = users;
        this.mapper = mapper;
        this.audit = audit;
        this.clock = clock;
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public ManagementViews.Application submit(ManagementRequests.PartnerApplicationRequest request) {
        UUID userId = CurrentUser.require().id();
        User user = users.lockById(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.isEnabled() || user.getRole() != UserRole.CUSTOMER) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        PartnerApplication application = applications.lockByUserId(userId).orElseGet(PartnerApplication::new);
        if (application.getStatus() == PartnerApplication.Status.PENDING) return mapper.toApplication(application);
        if (application.getStatus() == PartnerApplication.Status.APPROVED) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
        application.setUserId(userId);
        application.setBusinessName(request.businessName().trim());
        application.setDescription(request.description().trim());
        application.setStatus(PartnerApplication.Status.PENDING);
        application.setReason(null);
        application.setReviewedBy(null);
        application.setReviewedAt(null);
        application.setCreatedAt(clock.instant());
        application = applications.saveAndFlush(application);
        audit.record(userId, "PARTNER_APPLICATION_SUBMITTED", "partner_application", application.getId(), null);
        return mapper.toApplication(application);
    }

    @Transactional(readOnly = true)
    public ManagementViews.Application mine() {
        return applications.findByUserId(CurrentUser.require().id()).map(mapper::toApplication).orElse(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<ManagementViews.Application> list(PartnerApplication.Status status, int page, int size) {
        return applications.search(status, ManagementPages.of(page, size)).map(mapper::toApplication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ManagementViews.Application decide(UUID id, ManagementRequests.Decision request) {
        // All application writes take user -> application locks in that order.
        // Read only the owner ID before locking. Loading an entity here would leave
        // stale application state in the persistence context while waiting for the user lock.
        UUID applicantId = applications.findUserIdById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        User user = users.lockById(applicantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        PartnerApplication application = applications.lockByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        PartnerApplication.Status decision = Boolean.TRUE.equals(request.approved())
                ? PartnerApplication.Status.APPROVED : PartnerApplication.Status.REJECTED;
        if (application.getStatus() == decision) return mapper.toApplication(application);
        ManagementValidation.version(request.version(), application.getVersion());
        if (application.getStatus() != PartnerApplication.Status.PENDING) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
        if (decision == PartnerApplication.Status.APPROVED) {
            if (!user.isEnabled() || user.getRole() != UserRole.CUSTOMER) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
            user.setRole(UserRole.PARTNER);
            user.setAuthVersion(user.getAuthVersion() + 1);
            users.save(user);
        }
        application.setStatus(decision);
        application.setReason(request.reason().trim());
        application.setReviewedBy(CurrentUser.require().id());
        application.setReviewedAt(clock.instant());
        application = applications.saveAndFlush(application);
        audit.record(CurrentUser.require().id(), "PARTNER_APPLICATION_" + decision.name(),
                "partner_application", id, application.getReason());
        return mapper.toApplication(application);
    }
}
