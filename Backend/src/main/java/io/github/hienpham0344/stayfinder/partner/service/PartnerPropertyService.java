package io.github.hienpham0344.stayfinder.partner.service;

import io.github.hienpham0344.stayfinder.accommodation.entity.*;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationTypeRepository;
import io.github.hienpham0344.stayfinder.accommodation.repository.FeatureRepository;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationChanged;
import io.github.hienpham0344.stayfinder.audit.service.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.*;
import io.github.hienpham0344.stayfinder.management.service.ManagementPages;
import io.github.hienpham0344.stayfinder.management.service.ManagementValidation;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.repository.RoomTypeRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@PreAuthorize("hasRole('PARTNER')")
public class PartnerPropertyService {
    private final ManagementAccommodationRepository accommodations;
    private final ManagementRoomRepository rooms;
    private final AccommodationTypeRepository accommodationTypes;
    private final RoomTypeRepository roomTypes;
    private final FeatureRepository features;
    private final ManagementImageRepository images;
    private final ManagementFeatureRepository links;
    private final ManagementMapper mapper;
    private final AuditService audit;
    private final Clock clock;
    private final ApplicationEventPublisher events;

    public PartnerPropertyService(ManagementAccommodationRepository accommodations, ManagementRoomRepository rooms,
                                  AccommodationTypeRepository accommodationTypes, RoomTypeRepository roomTypes,
                                  FeatureRepository features, ManagementImageRepository images,
                                  ManagementFeatureRepository links, ManagementMapper mapper, AuditService audit,
                                  Clock clock, ApplicationEventPublisher events) {
        this.accommodations = accommodations;
        this.rooms = rooms;
        this.accommodationTypes = accommodationTypes;
        this.roomTypes = roomTypes;
        this.features = features;
        this.images = images;
        this.links = links;
        this.mapper = mapper;
        this.audit = audit;
        this.clock = clock;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public Page<ManagementViews.Accommodation> list(AccommodationStatus status, int page, int size) {
        return accommodations.findOwned(CurrentUser.require().id(), status, ManagementPages.of(page, size))
                .map(mapper::toAccommodation);
    }

    @Transactional(readOnly = true)
    public ManagementViews.PropertyDetail get(UUID id) {
        Accommodation accommodation = accommodations.findByIdAndPartnerId(id, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        return detail(accommodation);
    }

    @Transactional
    public ManagementViews.PropertyDetail create(ManagementRequests.AccommodationWrite request) {
        validateProperty(request);
        Accommodation accommodation = new Accommodation();
        accommodation.setPartnerId(CurrentUser.require().id());
        accommodation.setCreatedAt(clock.instant());
        writeProperty(accommodation, request);
        accommodation = accommodations.saveAndFlush(accommodation);
        replaceMetadata(accommodation.getId(), request);
        changed(accommodation, "ACCOMMODATION_CREATED");
        return detail(accommodation);
    }

    @Transactional
    public ManagementViews.PropertyDetail update(UUID id, ManagementRequests.AccommodationWrite request) {
        Accommodation accommodation = ownedForEdit(id);
        ManagementValidation.version(request.version(), accommodation.getVersion());
        validateProperty(request);
        writeProperty(accommodation, request);
        replaceMetadata(id, request);
        accommodation = accommodations.saveAndFlush(accommodation);
        changed(accommodation, "ACCOMMODATION_UPDATED");
        return detail(accommodation);
    }

    @Transactional
    public ManagementViews.Accommodation deactivate(UUID id, ManagementRequests.VersionRequest request) {
        Accommodation accommodation = ownedForEdit(id);
        ManagementValidation.version(request.version(), accommodation.getVersion());
        accommodation.setStatus(AccommodationStatus.INACTIVE);
        touch(accommodation);
        accommodation = accommodations.saveAndFlush(accommodation);
        changed(accommodation, "ACCOMMODATION_DEACTIVATED");
        return mapper.toAccommodation(accommodation);
    }

    @Transactional(readOnly = true)
    public Page<ManagementViews.Room> rooms(UUID accommodationId, RoomStatus status, int page, int size) {
        if (accommodations.findByIdAndPartnerId(accommodationId, CurrentUser.require().id()).isEmpty()) {
            throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        }
        return rooms.findOwned(accommodationId, CurrentUser.require().id(), status, ManagementPages.of(page, size))
                .map(mapper::toRoom);
    }

    @Transactional
    public ManagementViews.Room createRoom(UUID accommodationId, ManagementRequests.RoomWrite request) {
        Accommodation accommodation = ownedForEdit(accommodationId);
        validateRoom(request);
        Room room = new Room();
        room.setAccommodationId(accommodationId);
        room.setCreatedAt(clock.instant());
        writeRoom(room, request);
        room = rooms.saveAndFlush(room);
        resubmit(accommodation);
        changed(accommodation, "ROOM_CREATED");
        return mapper.toRoom(room);
    }

    @Transactional
    public ManagementViews.Room updateRoom(UUID accommodationId, UUID roomId, ManagementRequests.RoomWrite request) {
        Accommodation accommodation = ownedForEdit(accommodationId);
        Room room = rooms.lockOwned(roomId, accommodationId, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        ManagementValidation.version(request.version(), room.getVersion());
        validateRoom(request);
        writeRoom(room, request);
        room = rooms.saveAndFlush(room);
        resubmit(accommodation);
        changed(accommodation, "ROOM_UPDATED");
        return mapper.toRoom(room);
    }

    @Transactional
    public ManagementViews.Room deactivateRoom(UUID accommodationId, UUID roomId, ManagementRequests.VersionRequest request) {
        Accommodation accommodation = ownedForEdit(accommodationId);
        Room room = rooms.lockOwned(roomId, accommodationId, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        ManagementValidation.version(request.version(), room.getVersion());
        room.setStatus(RoomStatus.UNAVAILABLE);
        room = rooms.saveAndFlush(room);
        touch(accommodation);
        accommodations.saveAndFlush(accommodation);
        changed(accommodation, "ROOM_DEACTIVATED");
        return mapper.toRoom(room);
    }

    private Accommodation ownedForEdit(UUID id) {
        return accommodations.lockOwnedForEdit(id, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
    }

    private void validateProperty(ManagementRequests.AccommodationWrite request) {
        ManagementValidation.money(request.basePrice());
        ManagementValidation.imageUrls(request.imageUrls());
        if (request.featureIds() == null || request.featureIds().size() > 30
                || new HashSet<>(request.featureIds()).size() != request.featureIds().size()
                || request.featureIds().stream().anyMatch(java.util.Objects::isNull)
                || !accommodationTypes.existsById(request.typeId())
                || features.findAllById(request.featureIds()).size() != request.featureIds().size()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }

    private void writeProperty(Accommodation accommodation, ManagementRequests.AccommodationWrite request) {
        accommodation.setName(request.name().trim());
        accommodation.setAddress(request.address().trim());
        accommodation.setDescription(request.description());
        accommodation.setTypeId(request.typeId());
        accommodation.setLatitude(request.latitude());
        accommodation.setLongitude(request.longitude());
        accommodation.setBasePrice(request.basePrice());
        accommodation.setStatus(AccommodationStatus.PENDING);
        touch(accommodation);
    }

    private void replaceMetadata(UUID id, ManagementRequests.AccommodationWrite request) {
        images.deleteByAccommodationId(id);
        List<Image> replacements = request.imageUrls().stream().map(url -> {
            Image image = new Image();
            image.setAccommodationId(id);
            image.setUrl(url);
            return image;
        }).toList();
        images.saveAll(replacements);
        links.deleteByIdAccommodationId(id);
        links.saveAll(request.featureIds().stream().map(featureId -> {
            AccommodationFeature link = new AccommodationFeature();
            link.setId(new AccommodationFeatureId(id, featureId));
            return link;
        }).toList());
    }

    private void validateRoom(ManagementRequests.RoomWrite request) {
        ManagementValidation.money(request.price());
        if (request.capacity() == null || request.capacity() < 1 || request.capacity() > 100
                || !roomTypes.existsById(request.roomTypeId())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }

    private void writeRoom(Room room, ManagementRequests.RoomWrite request) {
        room.setRoomTypeId(request.roomTypeId());
        room.setName(request.name().trim());
        room.setDescription(request.description());
        room.setPrice(request.price());
        room.setCapacity(request.capacity());
        room.setStatus(request.status());
    }

    private void resubmit(Accommodation accommodation) {
        accommodation.setStatus(AccommodationStatus.PENDING);
        touch(accommodation);
        accommodations.saveAndFlush(accommodation);
    }

    private void touch(Accommodation accommodation) {
        Instant now = clock.instant();
        if (accommodation.getUpdatedAt() != null && !now.isAfter(accommodation.getUpdatedAt())) {
            now = accommodation.getUpdatedAt().plusNanos(1);
        }
        accommodation.setUpdatedAt(now);
    }

    private void changed(Accommodation accommodation, String action) {
        audit.record(CurrentUser.require().id(), action, "accommodation", accommodation.getId(), null);
        events.publishEvent(new AccommodationChanged(accommodation.getId()));
    }

    private ManagementViews.PropertyDetail detail(Accommodation accommodation) {
        return new ManagementViews.PropertyDetail(mapper.toAccommodation(accommodation),
                images.findByAccommodationIdOrderById(accommodation.getId()).stream().map(Image::getUrl).toList(),
                links.findByIdAccommodationId(accommodation.getId()).stream()
                        .map(link -> link.getId().getFeaturesId()).sorted().toList());
    }
}
