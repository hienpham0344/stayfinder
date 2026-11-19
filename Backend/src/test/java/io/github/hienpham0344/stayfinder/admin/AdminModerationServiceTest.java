package io.github.hienpham0344.stayfinder.admin;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationChanged;
import io.github.hienpham0344.stayfinder.admin.service.AdminModerationService;
import io.github.hienpham0344.stayfinder.audit.repository.AuditLogRepository;
import io.github.hienpham0344.stayfinder.audit.service.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.*;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminModerationServiceTest {
    private final ManagementAccommodationRepository accommodations = mock(ManagementAccommodationRepository.class);
    private final ManagementRoomRepository rooms = mock(ManagementRoomRepository.class);
    private final ManagementUserRepository users = mock(ManagementUserRepository.class);
    private final ManagementReviewRepository reviews = mock(ManagementReviewRepository.class);
    private final AuditService audit = mock(AuditService.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final AdminModerationService service = new AdminModerationService(accommodations, rooms, users, reviews,
            mock(ManagementImageRepository.class), mock(ManagementFeatureRepository.class), mock(AuditLogRepository.class),
            Mappers.getMapper(ManagementMapper.class), audit, Clock.systemUTC(), events);
    private final UUID administrator = UUID.randomUUID();

    @BeforeEach
    void login() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(administrator, "admin@example.invalid", UserRole.ADMIN), null, List.of()));
    }

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    @Test
    void cannotPublishPropertyForDisabledPartnerOrWithoutBookableRoom() {
        Accommodation accommodation = pending();
        User partner = new User();
        partner.setId(accommodation.getPartnerId());
        partner.setRole(UserRole.PARTNER);
        partner.setEnabled(false);
        when(accommodations.lockById(accommodation.getId())).thenReturn(Optional.of(accommodation));
        when(users.findById(partner.getId())).thenReturn(Optional.of(partner));
        var request = new ManagementRequests.AccommodationModeration(AccommodationStatus.ACTIVE, "checked", 0L);

        assertEquals(ErrorCode.VALIDATION_ERROR, assertThrows(BusinessException.class,
                () -> service.moderateAccommodation(accommodation.getId(), request)).getErrorCode());
        partner.setEnabled(true);
        when(rooms.existsByAccommodationIdAndStatus(accommodation.getId(), RoomStatus.AVAILABLE)).thenReturn(false);
        assertEquals(ErrorCode.VALIDATION_ERROR, assertThrows(BusinessException.class,
                () -> service.moderateAccommodation(accommodation.getId(), request)).getErrorCode());

        assertEquals(AccommodationStatus.PENDING, accommodation.getStatus());
        verifyNoInteractions(audit, events);
    }

    @Test
    void approvalIsAuditedAndInvalidatesPublicCacheButReplayHasNoExtraEffects() {
        Accommodation accommodation = pending();
        User partner = new User();
        partner.setId(accommodation.getPartnerId());
        partner.setRole(UserRole.PARTNER);
        when(accommodations.lockById(accommodation.getId())).thenReturn(Optional.of(accommodation));
        when(users.findById(partner.getId())).thenReturn(Optional.of(partner));
        when(rooms.existsByAccommodationIdAndStatus(accommodation.getId(), RoomStatus.AVAILABLE)).thenReturn(true);
        when(accommodations.saveAndFlush(accommodation)).thenReturn(accommodation);
        var request = new ManagementRequests.AccommodationModeration(AccommodationStatus.ACTIVE, "checked", 0L);

        assertEquals(AccommodationStatus.ACTIVE, service.moderateAccommodation(accommodation.getId(), request).status());
        service.moderateAccommodation(accommodation.getId(), request);

        verify(accommodations, times(1)).saveAndFlush(accommodation);
        verify(audit, times(1)).record(administrator, "ACCOMMODATION_ACTIVE", "accommodation", accommodation.getId(), "checked");
        verify(events, times(1)).publishEvent(new AccommodationChanged(accommodation.getId()));
    }

    private Accommodation pending() {
        Accommodation accommodation = new Accommodation();
        accommodation.setId(UUID.randomUUID());
        accommodation.setPartnerId(UUID.randomUUID());
        accommodation.setStatus(AccommodationStatus.PENDING);
        return accommodation;
    }
}
