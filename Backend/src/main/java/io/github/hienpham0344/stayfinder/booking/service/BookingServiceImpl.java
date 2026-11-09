package io.github.hienpham0344.stayfinder.booking.service;

import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationBookingView;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationLookup;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationSnapshot;
import io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationSnapshotRepository;
import io.github.hienpham0344.stayfinder.booking.dto.BookingResponse;
import io.github.hienpham0344.stayfinder.booking.dto.BookingDetailResponse;
import io.github.hienpham0344.stayfinder.booking.dto.CreateBookingRequest;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import io.github.hienpham0344.stayfinder.booking.repository.BookingDetailRepository;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.mapper.BookingMapper;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.RoomStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.room.service.RoomBookingView;
import io.github.hienpham0344.stayfinder.room.service.RoomLookup;
import io.github.hienpham0344.stayfinder.room.entity.RoomSnapshot;
import io.github.hienpham0344.stayfinder.room.repository.RoomSnapshotRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final AccommodationSnapshotRepository accommodationSnapshotRepository;
    private final RoomSnapshotRepository roomSnapshotRepository;
    private final AccommodationLookup accommodationLookup;
    private final RoomLookup roomLookup;
    private final RoomBookingAvailability roomBookingAvailability;
    private final BookingMapper mapper;

    public BookingServiceImpl(BookingRepository bookingRepository, BookingDetailRepository bookingDetailRepository,
                              AccommodationSnapshotRepository accommodationSnapshotRepository,
                              RoomSnapshotRepository roomSnapshotRepository,
                              AccommodationLookup accommodationLookup, RoomLookup roomLookup,
                              RoomBookingAvailability roomBookingAvailability,
                              BookingMapper mapper) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.accommodationSnapshotRepository = accommodationSnapshotRepository;
        this.roomSnapshotRepository = roomSnapshotRepository;
        this.accommodationLookup = accommodationLookup;
        this.roomLookup = roomLookup;
        this.roomBookingAvailability = roomBookingAvailability;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> list(Pageable pageable) {
        UUID userId = CurrentUser.require().id();
        Page<Booking> bookings = bookingRepository.findByUserId(userId, pageable);
        if (bookings.isEmpty()) return bookings.map(booking -> toResponse(booking, List.of()));
        List<UUID> bookingIds = bookings.getContent().stream().map(Booking::getId).toList();
        Map<UUID, List<BookingDetailResponse>> detailsByBooking = toDetailResponses(
                bookingDetailRepository.findByBookingIdIn(bookingIds));
        return bookings.map(booking -> toResponse(booking,
                detailsByBooking.getOrDefault(booking.getId(), List.of())));
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
        RoomBookingView room = roomLookup.findBookingViewForUpdate(request.roomId())
                .filter(item -> request.accommodationId().equals(item.accommodationId()))
                .filter(item -> item.status() == RoomStatus.AVAILABLE)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE));
        if (room.price() == null || room.price().signum() <= 0
                || room.price().stripTrailingZeros().scale() > 0
                || roomBookingAvailability.hasOverlap(room.id(), request.checkIn(), request.checkOut())) {
            throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE);
        }
        long nights = ChronoUnit.DAYS.between(request.checkIn(), request.checkOut());
        BigDecimal subtotal = room.price().multiply(BigDecimal.valueOf(nights * (long) request.quantity()));
        if (subtotal.compareTo(BigDecimal.valueOf(Long.MAX_VALUE)) > 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        if (accommodation.basePrice() != null && accommodation.basePrice().signum() < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        AccommodationSnapshot accommodationSnapshot = new AccommodationSnapshot();
        accommodationSnapshot.setAccommodationId(accommodation.id());
        accommodationSnapshot.setName(accommodation.name());
        accommodationSnapshot.setAddress(accommodation.address());
        accommodationSnapshot = accommodationSnapshotRepository.save(accommodationSnapshot);

        RoomSnapshot roomSnapshot = new RoomSnapshot();
        roomSnapshot.setRoomId(room.id());
        roomSnapshot.setName(room.name());
        roomSnapshot.setPrice(room.price());
        roomSnapshot.setDescription(room.description());
        roomSnapshot = roomSnapshotRepository.save(roomSnapshot);

        Booking booking = new Booking();
        booking.setUserId(CurrentUser.require().id());
        booking.setTotalPrice(subtotal);
        booking.setStatus(BookingStatus.PENDING);
        booking.setCreatedAt(Instant.now());
        booking = bookingRepository.save(booking);

        BookingDetail detail = new BookingDetail();
        detail.setBookingId(booking.getId());
        detail.setAccommodationSnapshotId(accommodationSnapshot.getId());
        detail.setRoomSnapshotId(roomSnapshot.getId());
        detail.setCheckInDate(request.checkIn());
        detail.setCheckOutDate(request.checkOut());
        detail.setQuantity(request.quantity());
        detail.setSubtotal(subtotal);
        bookingDetailRepository.save(detail);
        return toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancel(UUID id) {
        Booking booking = bookingRepository.findOwnedForPaymentUpdate(id, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.PENDING) {
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
        return toResponse(booking, toDetailResponses(bookingDetailRepository.findByBookingId(booking.getId()))
                .getOrDefault(booking.getId(), List.of()));
    }

    private Map<UUID, List<BookingDetailResponse>> toDetailResponses(List<BookingDetail> details) {
        if (details.isEmpty()) return Map.of();
        Map<UUID, AccommodationSnapshot> accommodations = new HashMap<>();
        Map<UUID, RoomSnapshot> rooms = new HashMap<>();
        List<UUID> accommodationIds = details.stream().map(BookingDetail::getAccommodationSnapshotId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        List<UUID> roomIds = details.stream().map(BookingDetail::getRoomSnapshotId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        accommodationSnapshotRepository.findAllById(accommodationIds)
                .forEach(item -> accommodations.put(item.getId(), item));
        roomSnapshotRepository.findAllById(roomIds)
                .forEach(item -> rooms.put(item.getId(), item));
        return details.stream().collect(Collectors.groupingBy(BookingDetail::getBookingId,
                Collectors.mapping(detail -> {
                    BookingDetailResponse base = mapper.toDetailResponse(detail);
                    AccommodationSnapshot accommodation = accommodations.get(detail.getAccommodationSnapshotId());
                    RoomSnapshot room = rooms.get(detail.getRoomSnapshotId());
                    return new BookingDetailResponse(base.id(), base.roomSnapshotId(), base.checkInDate(),
                            base.checkOutDate(), base.quantity(), base.subtotal(),
                            accommodation == null ? null : accommodation.getAccommodationId(),
                            accommodation == null ? null : accommodation.getName(),
                            room == null ? null : room.getRoomId(),
                            room == null ? null : room.getName());
                }, Collectors.toList())));
    }

    private BookingResponse toResponse(Booking booking, List<BookingDetailResponse> details) {
        return new BookingResponse(booking.getId(), booking.getUserId(), booking.getTotalPrice(), booking.getStatus(),
                booking.getCreatedAt(), details);
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut, int quantity, int guests) {
        if (checkIn == null || checkOut == null || checkIn.isBefore(LocalDate.now())
                || !checkIn.isBefore(checkOut)
                || quantity != 1 || guests < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }
}
