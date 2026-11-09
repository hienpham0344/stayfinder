package io.github.hienpham0344.stayfinder.partner.service;

import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.partner.dto.CreatePartnerRoomRequest;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomDetails;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomOffer;
import io.github.hienpham0344.stayfinder.partner.dto.PartnerRoomResponse;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.mapper.RoomMapper;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import io.github.hienpham0344.stayfinder.room.repository.RoomTypeRepository;
import io.github.hienpham0344.stayfinder.snapshot.repository.SnapshotSourceQueryRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PartnerRoomService {
    private final AccommodationRepository accommodations;
    private final RoomRepository rooms;
    private final RoomTypeRepository roomTypes;
    private final SnapshotSourceQueryRepository bookings;
    private final RoomMapper mapper;
    private final Clock clock;

    public PartnerRoomService(AccommodationRepository accommodations, RoomRepository rooms,
                              RoomTypeRepository roomTypes, SnapshotSourceQueryRepository bookings,
                              RoomMapper mapper, Clock clock) {
        this.accommodations = accommodations;
        this.rooms = rooms;
        this.roomTypes = roomTypes;
        this.bookings = bookings;
        this.mapper = mapper;
        this.clock = clock;
    }

    public PageResponse<PartnerRoomResponse> list(UUID partnerId, UUID accommodationId, Pageable page) {
        if (!accommodations.existsByIdAndPartnerId(accommodationId, partnerId)) {
            throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        }
        return PageResponse.from(rooms.findByAccommodationId(accommodationId, page).map(mapper::toPartnerResponse));
    }

    @Transactional
    public PartnerRoomResponse create(UUID partnerId, UUID accommodationId, CreatePartnerRoomRequest request) {
        requireLockedAccommodation(partnerId, accommodationId);
        Room room = new Room();
        room.setAccommodationId(accommodationId);
        room.setCreatedAt(clock.instant());
        applyDetails(room, request.details());
        applyOffer(room, request.offer());
        return mapper.toPartnerResponse(rooms.save(room));
    }

    @Transactional
    public PartnerRoomResponse updateDetails(UUID partnerId, UUID accommodationId, UUID roomId,
                                             PartnerRoomDetails details) {
        Room room = lockOwnedRoom(partnerId, accommodationId, roomId);
        validateCapacityReduction(room, details);
        applyDetails(room, details);
        return mapper.toPartnerResponse(room);
    }

    @Transactional
    public PartnerRoomResponse updateOffer(UUID partnerId, UUID accommodationId, UUID roomId, PartnerRoomOffer offer) {
        Room room = lockOwnedRoom(partnerId, accommodationId, roomId);
        applyOffer(room, offer);
        return mapper.toPartnerResponse(room);
    }

    private Room lockOwnedRoom(UUID partnerId, UUID accommodationId, UUID roomId) {
        // Scope the lock to the owner and take room before accommodation, matching booking confirmation.
        Room room = rooms.lockOwned(roomId, accommodationId, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        requireLockedAccommodation(partnerId, accommodationId);
        return room;
    }

    private void requireLockedAccommodation(UUID partnerId, UUID accommodationId) {
        accommodations.lockOwned(accommodationId, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
    }

    private void validateCapacityReduction(Room room, PartnerRoomDetails details) {
        boolean reducesStock = room.getStockTotal() == null || details.stockTotal() < room.getStockTotal();
        boolean reducesGuestLimit = room.getMaxGuestsPerRoom() == null
                || details.maxGuestsPerRoom() < room.getMaxGuestsPerRoom();
        if (!reducesStock && !reducesGuestLimit) {
            return;
        }

        // Keep existing reservations safe. Include the preceding UTC day for properties west of UTC.
        LocalDate firstPossibleLocalDay = LocalDate.now(clock.withZone(ZoneOffset.UTC)).minusDays(1);
        if (!bookings.findOverlaps(room.getAccommodationId(), List.of(room.getId()), firstPossibleLocalDay,
                LocalDate.of(9999, 12, 31), clock.instant()).isEmpty()) {
            throw new BusinessException(ErrorCode.ROOM_CAPACITY_RESERVED);
        }
    }

    private void applyDetails(Room room, PartnerRoomDetails details) {
        if (details.roomTypeId() != null && !roomTypes.existsById(details.roomTypeId())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        room.setRoomTypeId(details.roomTypeId());
        room.setName(details.name().strip());
        room.setDescription(details.description());
        room.setMaxGuestsPerRoom(details.maxGuestsPerRoom());
        room.setStockTotal(details.stockTotal());
        room.setSizeSqm(details.sizeSqm());
        room.setBedType(details.bedType());
        room.setIncludesBreakfast(details.includesBreakfast());
        room.setImageUrls(details.imageUrls().toArray(String[]::new));
    }

    private void applyOffer(Room room, PartnerRoomOffer offer) {
        // Quotes and search read this USD cents field. Keep any historical price in its original currency.
        room.setNightlyPriceCents(offer.nightlyPriceCents());
        room.setStatus(offer.status());
    }
}
