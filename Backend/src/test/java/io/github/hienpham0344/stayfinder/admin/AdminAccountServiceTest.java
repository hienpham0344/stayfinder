package io.github.hienpham0344.stayfinder.admin;

import io.github.hienpham0344.stayfinder.admin.service.AdminAccountService;
import io.github.hienpham0344.stayfinder.audit.service.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.ManagementUserRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminAccountServiceTest {
    private final ManagementUserRepository users = mock(ManagementUserRepository.class);
    private final AuditService audit = mock(AuditService.class);
    private final AdminAccountService service = new AdminAccountService(users, Mappers.getMapper(ManagementMapper.class), audit);

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    @Test
    void cannotDisableOrDemoteLastEnabledAdministrator() {
        User admin = user(UserRole.ADMIN);
        when(users.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(admin));
        when(users.lockById(admin.getId())).thenReturn(Optional.of(admin));
        login(admin);

        assertEquals(ErrorCode.FORBIDDEN, assertThrows(BusinessException.class, () -> service.update(admin.getId(),
                new ManagementRequests.AccountUpdate(UserRole.ADMIN, false, "disable", 0L))).getErrorCode());
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(BusinessException.class, () -> service.update(admin.getId(),
                new ManagementRequests.AccountUpdate(UserRole.CUSTOMER, true, "demote", 0L))).getErrorCode());

        assertTrue(admin.isEnabled());
        assertEquals(UserRole.ADMIN, admin.getRole());
        verify(users, never()).saveAndFlush(any());
        verifyNoInteractions(audit);
    }

    @Test
    void privilegeChangeLocksAdminsBeforeTargetAndInvalidatesExistingTokens() {
        User actor = user(UserRole.ADMIN);
        User target = user(UserRole.PARTNER);
        target.setAuthVersion(7L);
        login(actor);
        when(users.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(actor));
        when(users.lockById(target.getId())).thenReturn(Optional.of(target));
        when(users.saveAndFlush(target)).thenReturn(target);

        var result = service.update(target.getId(),
                new ManagementRequests.AccountUpdate(UserRole.CUSTOMER, false, "policy violation", 0L));

        assertFalse(result.enabled());
        assertEquals(UserRole.CUSTOMER, result.role());
        assertEquals(8L, target.getAuthVersion());
        var order = inOrder(users);
        order.verify(users).lockEnabledByRole(UserRole.ADMIN);
        order.verify(users).lockById(target.getId());
        verify(audit).record(actor.getId(), "ACCOUNT_PRIVILEGES_UPDATED", "user", target.getId(), "policy violation");
    }

    @Test
    void staleUpdateCannotOverwriteAccountChanges() {
        User actor = user(UserRole.ADMIN);
        User target = user(UserRole.CUSTOMER);
        target.setVersion(4L);
        login(actor);
        when(users.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(actor));
        when(users.lockById(target.getId())).thenReturn(Optional.of(target));

        assertEquals(ErrorCode.CONCURRENT_UPDATE, assertThrows(BusinessException.class, () -> service.update(target.getId(),
                new ManagementRequests.AccountUpdate(UserRole.ADMIN, true, "promote", 3L))).getErrorCode());

        assertEquals(UserRole.CUSTOMER, target.getRole());
        assertEquals(0L, target.getAuthVersion());
        verifyNoInteractions(audit);
    }

    private User user(UserRole role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        user.setEmail("test@example.invalid");
        return user;
    }

    private void login(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(user.getId(), user.getEmail(), user.getRole()), null, List.of()));
    }
}
