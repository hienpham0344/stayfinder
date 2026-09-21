package io.github.hienpham0344.stayfinder.booking.service;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationBookingView;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.booking.dto.BookingResponse;
import io.github.hienpham0344.stayfinder.booking.dto.CreateBookingRequest;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.repository.BookingDetailRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.mapper.BookingMapper;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.room.service.RoomBookingView;
import io.github.hienpham0344.stayfinder.room.service.RoomLookup;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final AccommodationLookup accommodationLookup;
    private final RoomLookup roomLookup;
    private final RoomBookingAvailability roomBookingAvailability;
    private final BookingMapper mapper;

    public BookingServiceImpl(BookingRepository bookingRepository, BookingDetailRepository bookingDetailRepository,
                              AccommodationLookup accommodationLookup, RoomLookup roomLookup,
                              RoomBookingAvailability roomBookingAvailability,
                              BookingMapper mapper) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.accommodationLookup = accommodationLookup;
        this.roomLookup = roomLookup;
        this.roomBookingAvailability = roomBookingAvailability;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> list(Pageable pageable) {
        UUID userId = CurrentUser.require().id();
        return bookingRepository.findByUserId(userId, pageable)
                .map(booking -> toResponse(booking));
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse get(UUID id) {
        Booking booking = owned(id);
        return toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse create(CreateBookingRequest request) {
        validateDates(request.checkIn(), request.checkOut(), request.quantity(), request.guests());
        AccommodationBookingView accommodation = accommodationLookup.findBookingView(request.accommodationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOMMODATION_NOT_FOUND));
        RoomBookingView room = roomLookup.findBookingView(request.roomId())
                .filter(item -> request.accommodationId().equals(item.accommodationId()))
                .filter(item -> item.status() == RoomStatus.AVAILABLE)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE));
        if (room.price() == null || roomBookingAvailability.hasOverlap(room.id(), request.checkIn(), request.checkOut())) {
            throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);
        }
        long nights = ChronoUnit.DAYS.between(request.checkIn(), request.checkOut());
        BigDecimal subtotal = room.price().multiply(BigDecimal.valueOf(nights * (long) request.quantity()));
        if (accommodation.basePrice() != null && accommodation.basePrice().signum() < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        // The live schema has no booking_details.room_id; its snapshot FK targets are outside this phase.
        // Persisting here would lose the selected room or violate the existing FK, so fail explicitly before writes.
        throw new BusinessException(ErrorCode.BOOKING_SNAPSHOT_REQUIRED);
    }

    @Override
    @Transactional
    public BookingResponse cancel(UUID id) {
        Booking booking = owned(id);
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return toResponse(bookingRepository.save(booking));
    }

    private Booking owned(UUID id) {
        return bookingRepository.findByIdAndUserId(id, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
    }

    private BookingResponse toResponse(Booking booking) {
        List<io.github.hienpham0344.stayfinder.booking.dto.BookingDetailResponse> details =
                bookingDetailRepository.findByBookingId(booking.getId()).stream().map(mapper::toDetailResponse).toList();
        return new BookingResponse(booking.getId(), booking.getUserId(), booking.getTotalPrice(), booking.getStatus(),
                booking.getCreatedAt(), details);
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut, int quantity, int guests) {
        if (checkIn == null || checkOut == null || !checkIn.isBefore(checkOut) || quantity < 1 || guests < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }
}
