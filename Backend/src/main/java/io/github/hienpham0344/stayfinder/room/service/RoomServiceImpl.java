package io.github.hienpham0344.stayfinder.room.service;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.booking.service.RoomBookingAvailability;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.room.dto.RoomResponse;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.mapper.RoomMapper;
import io.github.hienpham0344.stayfinder.room.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class RoomServiceImpl implements RoomService, RoomLookup {
    private final RoomRepository roomRepository;
    private final AccommodationLookup accommodationLookup;
    private final RoomBookingAvailability roomBookingAvailability;
    private final RoomMapper mapper;

    public RoomServiceImpl(RoomRepository roomRepository, AccommodationLookup accommodationLookup,
                           RoomBookingAvailability roomBookingAvailability, RoomMapper mapper) {
        this.roomRepository = roomRepository;
        this.accommodationLookup = accommodationLookup;
        this.roomBookingAvailability = roomBookingAvailability;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> listAvailable(UUID accommodationId, LocalDate checkIn, LocalDate checkOut, int guests) {
        if (checkIn == null || checkOut == null || !checkIn.isBefore(checkOut) || guests < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        if (accommodationLookup.findBookingView(accommodationId).isEmpty()) {
            throw new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND);
        }
        List<Room> rooms = roomRepository.findByAccommodationIdAndStatus(accommodationId, RoomStatus.AVAILABLE);
        if (rooms.isEmpty()) return List.of();
        Set<UUID> occupiedIds = roomBookingAvailability.overlappingRoomIds(
                rooms.stream().map(Room::getId).toList(), checkIn, checkOut);
        return rooms.stream()
                .filter(room -> !occupiedIds.contains(room.getId()))
                .map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RoomBookingView> findBookingView(UUID roomId) {
        return roomRepository.findById(roomId)
                .map(this::toBookingView);
    }

    @Override
    @Transactional
    public Optional<RoomBookingView> findBookingViewForUpdate(UUID roomId) {
        return roomRepository.findForBooking(roomId).map(this::toBookingView);
    }

    private RoomBookingView toBookingView(Room item) {
        return new RoomBookingView(item.getId(), item.getAccommodationId(), item.getPrice(), item.getStatus(),
                item.getName(), item.getDescription());
    }
}
