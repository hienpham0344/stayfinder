package io.github.hienpham0344.stayfinder.partner.service;

import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationDetailResponse;
import io.github.hienpham0344.stayfinder.accommodation.dto.AccommodationResponse;
import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeature;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeatureId;
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
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerAccommodationRequest;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerAccommodationResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PartnerAccommodationService {
    // The catalog queries use named time zones when comparing local check-in dates.
    private static final Set<String> SUPPORTED_TIME_ZONES = ZoneId.getAvailableZoneIds();

    private final AccommodationRepository accommodations;
    private final AccommodationTypeRepository types;
    private final LocationRepository locations;
    private final FeatureRepository features;
    private final AccommodationFeatureRepository links;
    private final ImageRepository images;
    private final AccommodationMapper mapper;
    private final Clock clock;

    public PartnerAccommodationService(AccommodationRepository accommodations, AccommodationTypeRepository types,
                                       LocationRepository locations, FeatureRepository features,
                                       AccommodationFeatureRepository links, ImageRepository images,
                                       AccommodationMapper mapper, Clock clock) {
        this.accommodations = accommodations;
        this.types = types;
        this.locations = locations;
        this.features = features;
        this.links = links;
        this.images = images;
        this.mapper = mapper;
        this.clock = clock;
    }

    public PageResponse<AccommodationResponse> list(UUID partnerId, Pageable page) {
        return PageResponse.from(accommodations.findByPartnerId(partnerId, page).map(mapper::toResponse));
    }

    public PartnerAccommodationResponse get(UUID partnerId, UUID accommodationId) {
        return detail(accommodations.findByIdAndPartnerId(accommodationId, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND)));
    }

    @Transactional
    public PartnerAccommodationResponse create(UUID partnerId, PartnerAccommodationRequest request) {
        Accommodation accommodation = new Accommodation();
        accommodation.setPartnerId(partnerId);
        accommodation.setCreatedAt(clock.instant());
        return save(accommodation, request);
    }

    @Transactional
    public PartnerAccommodationResponse update(UUID partnerId, UUID accommodationId,
                                               PartnerAccommodationRequest request) {
        Accommodation accommodation = accommodations.lockOwned(accommodationId, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        return save(accommodation, request);
    }

    private PartnerAccommodationResponse save(Accommodation accommodation, PartnerAccommodationRequest request) {
        var amenities = new LinkedHashSet<>(request.amenityIds());
        if (!types.existsById(request.typeId()) || !locations.existsById(request.locationId())
                || features.findAllById(amenities).size() != amenities.size()
                || !SUPPORTED_TIME_ZONES.contains(request.timezone())
                || (request.latitude() == null) != (request.longitude() == null)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        accommodation.setTimezone(request.timezone());
        accommodation.setTypeId(request.typeId());
        accommodation.setLocationId(request.locationId());
        accommodation.setName(request.name().strip());
        accommodation.setAddress(request.address().strip());
        accommodation.setDescription(request.description());
        accommodation.setLatitude(request.latitude());
        accommodation.setLongitude(request.longitude());
        accommodation.setCleaningFeeCents(request.cleaningFeeCents());
        accommodation.setServiceFeeCents(request.serviceFeeCents());
        accommodation.setBedrooms(request.bedrooms());
        accommodation.setBeds(request.beds());
        accommodation.setBaths(request.baths());
        // Listings already waiting for moderation keep their status when the owner edits their details.
        if (accommodation.getStatus() != AccommodationStatus.PENDING) {
            accommodation.setStatus(request.published() ? AccommodationStatus.ACTIVE : AccommodationStatus.INACTIVE);
        }

        UUID id = accommodations.save(accommodation).getId();
        syncAmenities(id, amenities);
        syncImages(id, new LinkedHashSet<>(request.imageUrls()));
        return detail(accommodation);
    }

    private void syncAmenities(UUID accommodationId, LinkedHashSet<UUID> requested) {
        for (AccommodationFeature link : links.findByIdAccommodationId(accommodationId)) {
            if (!requested.remove(link.getId().getFeaturesId())) {
                links.delete(link);
            }
        }
        for (UUID amenityId : requested) {
            AccommodationFeature link = new AccommodationFeature();
            link.setId(new AccommodationFeatureId(accommodationId, amenityId));
            links.save(link);
        }
    }

    private void syncImages(UUID accommodationId, LinkedHashSet<String> requested) {
        // Keep the IDs of unchanged images. The catalog uses them to choose its cover image.
        for (Image image : images.findByAccommodationId(accommodationId).stream()
                .sorted(Comparator.comparing(Image::getId)).toList()) {
            if (!requested.remove(image.getUrl())) {
                images.delete(image);
            }
        }
        for (String url : requested) {
            Image image = new Image();
            image.setAccommodationId(accommodationId);
            image.setUrl(url);
            images.save(image);
        }
    }

    private PartnerAccommodationResponse detail(Accommodation accommodation) {
        UUID id = accommodation.getId();
        var photoDtos = images.findByAccommodationId(id).stream().sorted(Comparator.comparing(Image::getId))
                .map(mapper::toImageResponse).toList();
        List<UUID> amenityIds = links.findByIdAccommodationId(id).stream()
                .map(link -> link.getId().getFeaturesId()).sorted().toList();
        var amenityDtos = features.findAllById(amenityIds).stream().map(mapper::toFeatureResponse).toList();
        return new PartnerAccommodationResponse(
                new AccommodationDetailResponse(mapper.toResponse(accommodation), photoDtos, amenityDtos),
                accommodation.getLocationId(), accommodation.getTimezone(), accommodation.getCleaningFeeCents(),
                accommodation.getServiceFeeCents(), accommodation.getBedrooms(), accommodation.getBeds(),
                accommodation.getBaths());
    }
}
