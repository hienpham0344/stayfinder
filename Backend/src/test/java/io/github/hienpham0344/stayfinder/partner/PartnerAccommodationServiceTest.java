package io.github.hienpham0344.stayfinder.partner;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeature;
import io.github.hienpham0344.stayfinder.accommodation.entity.Image;
import io.github.hienpham0344.stayfinder.accommodation.mapper.AccommodationMapper;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationFeatureRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationTypeRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.FeatureRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.ImageRepository;
import io.github.hienpham0344.stayfinder.catalog.repository.LocationRepository;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerAccommodationRequest;
import io.github.hienpham0344.stayfinder.partner.service.PartnerAccommodationService;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PartnerAccommodationServiceTest {
    private final UUID owner = UUID.randomUUID();
    private final UUID stayId = UUID.randomUUID();
    private final UUID locationId = UUID.randomUUID();
    private final UUID typeId = UUID.randomUUID();

    private final AccommodationRepository accommodations = mock(AccommodationRepository.class);
    private final AccommodationTypeRepository types = mock(AccommodationTypeRepository.class);
    private final LocationRepository locations = mock(LocationRepository.class);
    private final FeatureRepository features = mock(FeatureRepository.class);
    private final AccommodationFeatureRepository links = mock(AccommodationFeatureRepository.class);
    private final ImageRepository images = mock(ImageRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-01T12:00:00Z"), ZoneOffset.UTC);
    private final PartnerAccommodationService service = new PartnerAccommodationService(accommodations, types,
            locations, features, links, images, Mappers.getMapper(AccommodationMapper.class), clock);

    @Test
    void createsPublishedListingOwnedByAuthenticatedPartner() {
        allowSave();
        when(accommodations.save(any())).thenAnswer(call -> {
            Accommodation row = call.getArgument(0);
            row.setId(stayId);
            return row;
        });

        var result = service.create(owner, request("Asia/Ho_Chi_Minh"));

        ArgumentCaptor<Accommodation> saved = ArgumentCaptor.forClass(Accommodation.class);
        verify(accommodations).save(saved.capture());
        assertEquals(owner, saved.getValue().getPartnerId());
        assertEquals(clock.instant(), saved.getValue().getCreatedAt());
        assertEquals(AccommodationStatus.ACTIVE, result.detail().accommodation().status());
        assertEquals("Harbor Hotel", result.detail().accommodation().name());
        assertEquals("Asia/Ho_Chi_Minh", result.timezone());

        ArgumentCaptor<Image> image = ArgumentCaptor.forClass(Image.class);
        verify(images).save(image.capture());
        assertEquals(stayId, image.getValue().getAccommodationId());
        assertEquals("https://example.invalid/cover.jpg", image.getValue().getUrl());
    }

    @Test
    void updateDoesNotPublishListingAwaitingModeration() {
        Accommodation pending = new Accommodation();
        pending.setId(stayId);
        pending.setPartnerId(owner);
        pending.setStatus(AccommodationStatus.PENDING);
        allowSave();
        when(accommodations.lockOwned(stayId, owner)).thenReturn(Optional.of(pending));
        when(accommodations.save(pending)).thenReturn(pending);

        var result = service.update(owner, stayId, request("Asia/Ho_Chi_Minh"));

        assertEquals(AccommodationStatus.PENDING, result.detail().accommodation().status());
    }

    @Test
    void rejectsAnotherPartnersListingBeforeChangingItsDetails() {
        when(accommodations.lockOwned(stayId, owner)).thenReturn(Optional.empty());

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.update(owner, stayId, request("Asia/Ho_Chi_Minh")));

        assertEquals(ErrorCode.ACCOMMODATION_NOT_FOUND, error.getErrorCode());
        verifyNoInteractions(types, locations, features, images, links);
    }

    @Test
    void partnerCannotRepublishAnAdministrativelyBlockedProperty() {
        Accommodation blocked = new Accommodation();
        blocked.setId(stayId);
        blocked.setPartnerId(owner);
        blocked.setStatus(AccommodationStatus.INACTIVE);
        blocked.setModerationBlocked(true);
        allowSave();
        when(accommodations.lockOwned(stayId, owner)).thenReturn(Optional.of(blocked));
        when(accommodations.save(blocked)).thenReturn(blocked);
        var result = service.update(owner, stayId, request("Asia/Ho_Chi_Minh"));
        assertEquals(AccommodationStatus.INACTIVE, result.detail().accommodation().status());
        assertTrue(blocked.isModerationBlocked());
    }

    @Test
    void rejectsFixedOffsetThatCatalogDoesNotSupport() {
        allowSave();

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.create(owner, request("+07:00")));

        assertEquals(ErrorCode.VALIDATION_ERROR, error.getErrorCode());
        verifyNoInteractions(accommodations, images, links);
    }

    private void allowSave() {
        when(types.existsById(typeId)).thenReturn(true);
        when(locations.existsById(locationId)).thenReturn(true);
        when(features.findAllById(any())).thenReturn(List.of());
        when(links.findByIdAccommodationId(stayId)).thenReturn(List.<AccommodationFeature>of());
        when(images.findByAccommodationId(stayId)).thenReturn(List.of());
    }

    private PartnerAccommodationRequest request(String timezone) {
        return new PartnerAccommodationRequest(typeId, locationId, " Harbor Hotel ", "1 Harbor Road", null,
                null, null, timezone, 0L, 0L, null, null, null, true, List.of(),
                List.of("https://example.invalid/cover.jpg"));
    }
}
