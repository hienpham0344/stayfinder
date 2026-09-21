package io.github.hienpham0344.stayfinder.room.service;

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
import java.util.UUID;

@Service
public class RoomServiceImpl implements RoomService, RoomLookup {
    private final RoomRepository roomRepository;
    private final RoomBookingAvailability roomBookingAvailability;
    private final RoomMapper mapper;

    public RoomServiceImpl(RoomRepository roomRepository, RoomBookingAvailability roomBookingAvailability, RoomMapper mapper) {
        this.roomRepository = roomRepository;
        this.roomBookingAvailability = roomBookingAvailability;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> listAvailable(UUID accommodationId, LocalDate checkIn, LocalDate checkOut, int guests) {
        if (checkIn == null || checkOut == null || !checkIn.isBefore(checkOut) || guests < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        return roomRepository.findByAccommodationIdAndStatus(accommodationId, RoomStatus.AVAILABLE).stream()
                .filter(room -> !roomBookingAvailability.hasOverlap(room.getId(), checkIn, checkOut))
                .map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RoomBookingView> findBookingView(UUID roomId) {
        return roomRepository.findById(roomId)
                .map(item -> new RoomBookingView(item.getId(), item.getAccommodationId(), item.getPrice(), item.getStatus()));
    }
}
