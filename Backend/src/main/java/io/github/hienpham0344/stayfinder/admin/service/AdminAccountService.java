package io.github.hienpham0344.stayfinder.admin.service;

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
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountService {
    private final ManagementUserRepository users;
    private final ManagementMapper mapper;
    private final AuditService audit;

    public AdminAccountService(ManagementUserRepository users, ManagementMapper mapper, AuditService audit) {
        this.users = users;
        this.mapper = mapper;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public Page<ManagementViews.Account> list(UserRole role, Boolean enabled, int page, int size) {
        return users.search(role, enabled, ManagementPages.of(page, size)).map(mapper::toAccount);
    }

    @Transactional(readOnly = true)
    public ManagementViews.Account get(UUID id) {
        return mapper.toAccount(users.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)));
    }

    @Transactional
    public ManagementViews.Account update(UUID id, ManagementRequests.AccountUpdate request) {
        // Lock the common admin set in UUID order before any target row, so concurrent
        // demotions cannot each observe another administrator and remove the last one.
        List<User> admins = users.lockEnabledByRole(UserRole.ADMIN);
        User user = users.lockById(id).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        ManagementValidation.version(request.version(), user.getVersion());
        boolean removesAdmin = user.isEnabled() && user.getRole() == UserRole.ADMIN
                && (!request.enabled() || request.role() != UserRole.ADMIN);
        if (removesAdmin && admins.size() <= 1) throw new BusinessException(ErrorCode.FORBIDDEN);
        if (user.isEnabled() != request.enabled() || user.getRole() != request.role()) {
            user.setRole(request.role());
            user.setEnabled(request.enabled());
            user.setAuthVersion(user.getAuthVersion() + 1);
            user = users.saveAndFlush(user);
            audit.record(CurrentUser.require().id(), "ACCOUNT_PRIVILEGES_UPDATED", "user", id, request.reason().trim());
        }
        return mapper.toAccount(user);
    }
}
