package io.github.hienpham0344.stayfinder.admin.service;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationChanged;
import io.github.hienpham0344.stayfinder.audit.repository.AuditLogRepository;
import io.github.hienpham0344.stayfinder.audit.service.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.AccommodationStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.dto.ManagementRequests;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.*;
import io.github.hienpham0344.stayfinder.management.service.ManagementPages;
import io.github.hienpham0344.stayfinder.management.service.ManagementValidation;
import io.github.hienpham0344.stayfinder.review.entity.Review;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class AdminModerationService {
    private final ManagementAccommodationRepository accommodations;
    private final ManagementRoomRepository rooms;
    private final ManagementUserRepository users;
    private final ManagementReviewRepository reviews;
    private final ManagementImageRepository images;
    private final ManagementFeatureRepository links;
    private final AuditLogRepository logs;
    private final ManagementMapper mapper;
    private final AuditService audit;
    private final Clock clock;
    private final ApplicationEventPublisher events;

    public AdminModerationService(ManagementAccommodationRepository accommodations, ManagementRoomRepository rooms,
                                   ManagementUserRepository users, ManagementReviewRepository reviews,
                                   ManagementImageRepository images, ManagementFeatureRepository links,
                                   AuditLogRepository logs, ManagementMapper mapper, AuditService audit, Clock clock,
                                   ApplicationEventPublisher events) {
        this.accommodations = accommodations;
        this.rooms = rooms;
        this.users = users;
        this.reviews = reviews;
        this.images = images;
        this.links = links;
        this.logs = logs;
        this.mapper = mapper;
        this.audit = audit;
        this.clock = clock;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public Page<ManagementViews.Accommodation> accommodations(AccommodationStatus status, UUID partnerId, int page, int size) {
        return accommodations.search(status, partnerId, ManagementPages.of(page, size)).map(mapper::toAccommodation);
    }

    @Transactional(readOnly = true)
    public ManagementViews.PropertyDetail accommodation(UUID id) {
        Accommodation accommodation = accommodations.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        return new ManagementViews.PropertyDetail(mapper.toAccommodation(accommodation),
                images.findByAccommodationIdOrderById(id).stream()
                        .map(io.github.hienpham0344.stayfinder.accommodation.entity.Image::getUrl).toList(),
                links.findByIdAccommodationId(id).stream().map(link -> link.getId().getFeaturesId()).sorted().toList());
    }

    @Transactional(readOnly = true)
    public Page<ManagementViews.Room> rooms(UUID accommodationId, int page, int size) {
        if (!accommodations.existsById(accommodationId)) {
            throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        }
        return rooms.findByAccommodationId(accommodationId, ManagementPages.of(page, size)).map(mapper::toRoom);
    }

    @Transactional
    public ManagementViews.Accommodation moderateAccommodation(UUID id, ManagementRequests.AccommodationModeration request) {
        if (request.status() != AccommodationStatus.ACTIVE && request.status() != AccommodationStatus.INACTIVE) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        Accommodation accommodation = accommodations.lockById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        if (accommodation.getStatus() == request.status()) return mapper.toAccommodation(accommodation);
        ManagementValidation.version(request.version(), accommodation.getVersion());
        if (request.status() == AccommodationStatus.ACTIVE) {
            User partner = accommodation.getPartnerId() == null ? null
                    : users.findById(accommodation.getPartnerId()).orElse(null);
            if (partner == null || !partner.isEnabled() || partner.getRole() != UserRole.PARTNER
                    || !rooms.existsByAccommodationIdAndStatus(id, RoomStatus.AVAILABLE)) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR);
            }
        }
        accommodation.setStatus(request.status());
        accommodation.setUpdatedAt(clock.instant());
        accommodation = accommodations.saveAndFlush(accommodation);
        audit.record(CurrentUser.require().id(), "ACCOMMODATION_" + request.status().name(),
                "accommodation", id, request.reason().trim());
        events.publishEvent(new AccommodationChanged(id));
        return mapper.toAccommodation(accommodation);
    }

    @Transactional(readOnly = true)
    public Page<ManagementViews.Review> reviews(Boolean hidden, UUID accommodationId, int page, int size) {
        return reviews.search(hidden, accommodationId, ManagementPages.of(page, size)).map(mapper::toReview);
    }

    @Transactional
    public ManagementViews.Review moderateReview(UUID id, ManagementRequests.ReviewModeration request) {
        Review review = reviews.lockById(id).orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        if (review.isHidden() == request.hidden()) return mapper.toReview(review);
        ManagementValidation.version(request.version(), review.getVersion());
        review.setHidden(request.hidden());
        review = reviews.saveAndFlush(review);
        audit.record(CurrentUser.require().id(), request.hidden() ? "REVIEW_HIDDEN" : "REVIEW_RESTORED",
                "review", id, request.reason().trim());
        return mapper.toReview(review);
    }

    @Transactional(readOnly = true)
    public Page<ManagementViews.Audit> auditLogs(int page, int size) {
        return logs.findAll(ManagementPages.of(page, size)).map(mapper::toAudit);
    }
}
