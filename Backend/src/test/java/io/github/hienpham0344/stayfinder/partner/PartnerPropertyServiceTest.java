package io.github.hienpham0344.stayfinder.partner;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationTypeRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.FeatureRepository;
import io.github.hienpham0344.stayfinder.audit.service.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.*;
import io.github.hienpham0344.stayfinder.partner.service.PartnerPropertyService;
import io.github.hienpham0344.stayfinder.room.repository.RoomTypeRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PartnerPropertyServiceTest {
    private final ManagementAccommodationRepository accommodations = mock(ManagementAccommodationRepository.class);
    private final ManagementRoomRepository rooms = mock(ManagementRoomRepository.class);
    private final AccommodationTypeRepository types = mock(AccommodationTypeRepository.class);
    private final RoomTypeRepository roomTypes = mock(RoomTypeRepository.class);
    private final FeatureRepository features = mock(FeatureRepository.class);
    private final ManagementImageRepository images = mock(ManagementImageRepository.class);
    private final ManagementFeatureRepository links = mock(ManagementFeatureRepository.class);
    private final AuditService audit = mock(AuditService.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final UUID partnerId = UUID.randomUUID();
    private final PartnerPropertyService service = new PartnerPropertyService(accommodations, rooms, types,
            roomTypes, features, images, links, Mappers.getMapper(ManagementMapper.class), audit,
            Clock.systemUTC(), events);

    @BeforeEach
    void login() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(partnerId, "partner@example.invalid", UserRole.PARTNER), null, List.of()));
    }

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    @Test
    void foreignPropertyCannotBeChangedAndChildrenAreNeverRead() {
        UUID foreignId = UUID.randomUUID();
        when(accommodations.lockOwnedForEdit(foreignId, partnerId)).thenReturn(Optional.empty());

        assertEquals(ErrorCode.ACCOMMODATION_NOT_FOUND, assertThrows(BusinessException.class,
                () -> service.update(foreignId, request(0L, List.of()))).getErrorCode());

        verifyNoInteractions(rooms, images, links, features, audit, events);
    }

    @Test
    void staleVersionCannotReplaceImagesOrFeatures() {
        Accommodation accommodation = new Accommodation();
        accommodation.setId(UUID.randomUUID());
        accommodation.setVersion(3L);
        when(accommodations.lockOwnedForEdit(accommodation.getId(), partnerId)).thenReturn(Optional.of(accommodation));

        assertEquals(ErrorCode.CONCURRENT_UPDATE, assertThrows(BusinessException.class,
                () -> service.update(accommodation.getId(), request(2L, List.of()))).getErrorCode());

        verifyNoInteractions(types, images, links, features, audit, events);
    }

    @Test
    void imageUrlsRejectExecutableOrCredentialBearingSchemes() {
        assertEquals(ErrorCode.VALIDATION_ERROR, assertThrows(BusinessException.class,
                () -> service.create(request(null, List.of("javascript:alert(1)")))).getErrorCode());
        assertEquals(ErrorCode.VALIDATION_ERROR, assertThrows(BusinessException.class,
                () -> service.create(request(null, List.of("https://user:password@example.invalid/image.jpg")))).getErrorCode());
        verify(accommodations, never()).saveAndFlush(any());
        verifyNoInteractions(images, links, audit, events);
    }

    private ManagementRequests.AccommodationWrite request(Long version, List<String> urls) {
        return new ManagementRequests.AccommodationWrite("Stay", "Address", "Description", UUID.randomUUID(),
                null, null, BigDecimal.valueOf(100000), urls, List.of(), version);
    }
}
