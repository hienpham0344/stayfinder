package io.github.hienpham0344.stayfinder.management.service;

import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.dto.ManagementViews;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.ManagementBookingDetailRepository;
import io.github.hienpham0344.stayfinder.management.repository.ManagementBookingRepository;
import io.github.hienpham0344.stayfinder.management.repository.ManagementPaymentRepository;
import io.github.hienpham0344.stayfinder.management.repository.ManagementPaymentAnomalyRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class OperationsQueryService {
    private final ManagementBookingRepository bookings;
    private final ManagementBookingDetailRepository details;
    private final ManagementPaymentRepository payments;
    private final ManagementPaymentAnomalyRepository anomalies;
    private final ManagementMapper mapper;

    public OperationsQueryService(ManagementBookingRepository bookings, ManagementBookingDetailRepository details,
                                   ManagementPaymentRepository payments, ManagementPaymentAnomalyRepository anomalies,
                                   ManagementMapper mapper) {
        this.bookings = bookings;
        this.details = details;
        this.payments = payments;
        this.anomalies = anomalies;
        this.mapper = mapper;
    }

    @PreAuthorize("hasRole('PARTNER')")
    public Page<ManagementViews.Booking> partnerBookings(BookingStatus status, int page, int size) {
        return bookings.findOwned(CurrentUser.require().id(), status, ManagementPages.of(page, size)).map(mapper::toBooking);
    }

    @PreAuthorize("hasRole('PARTNER')")
    public ManagementViews.BookingDetail partnerBooking(UUID id) {
        UUID partnerId = CurrentUser.require().id();
        var booking = bookings.findOwnedById(id, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        return new ManagementViews.BookingDetail(mapper.toBooking(booking), lines(id, partnerId));
    }

    @PreAuthorize("hasRole('PARTNER')")
    public Page<ManagementViews.Payment> partnerPayments(PaymentStatus status, UUID bookingId, int page, int size) {
        return payments.findOwned(CurrentUser.require().id(), status, bookingId, ManagementPages.of(page, size))
                .map(mapper::toPayment);
    }

    @PreAuthorize("hasRole('PARTNER')")
    public ManagementViews.Payment partnerPayment(UUID id) {
        return mapper.toPayment(payments.findOwnedById(id, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Page<ManagementViews.Booking> adminBookings(BookingStatus status, UUID userId, int page, int size) {
        return bookings.search(status, userId, ManagementPages.of(page, size)).map(mapper::toBooking);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public ManagementViews.BookingDetail adminBooking(UUID id) {
        var booking = bookings.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        return new ManagementViews.BookingDetail(mapper.toBooking(booking), lines(id, null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Page<ManagementViews.Payment> adminPayments(PaymentStatus status, UUID bookingId, int page, int size) {
        return payments.search(status, bookingId, ManagementPages.of(page, size)).map(mapper::toPayment);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public ManagementViews.Payment adminPayment(UUID id) {
        return mapper.toPayment(payments.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Page<ManagementViews.PaymentAnomaly> paymentAnomalies(UUID bookingId, String reason, int page, int size) {
        return anomalies.search(bookingId, reason, ManagementPages.of(page, size)).map(mapper::toPaymentAnomaly);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public ManagementViews.PaymentAnomaly paymentAnomaly(UUID id) {
        return mapper.toPaymentAnomaly(anomalies.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND)));
    }

    @PreAuthorize("hasRole('PARTNER')")
    public ManagementViews.Statistics partnerStatistics() { return statistics(CurrentUser.require().id()); }

    @PreAuthorize("hasRole('ADMIN')")
    public ManagementViews.Statistics adminStatistics() { return statistics(null); }

    private ManagementViews.Statistics statistics(UUID partnerId) {
        // Separate global/owned statements let PostgreSQL plan a semi-join without nullable OR subplans/JIT.
        var counts = partnerId == null
                ? bookings.countsAll(BookingStatus.PENDING, BookingStatus.CANCELLED, BookingStatus.COMPLETED)
                : bookings.countsOwned(partnerId, BookingStatus.PENDING, BookingStatus.CANCELLED, BookingStatus.COMPLETED);
        var revenue = partnerId == null ? payments.receivedRevenueAll(PaymentStatus.SUCCESS)
                : payments.receivedRevenueOwned(partnerId, PaymentStatus.SUCCESS);
        return new ManagementViews.Statistics(zero(counts.getTotal()), zero(counts.getPendingCount()),
                zero(counts.getCancelledCount()), zero(counts.getCompletedCount()),
                revenue);
    }

    private long zero(Long value) { return value == null ? 0 : value; }

    private java.util.List<ManagementViews.BookingLine> lines(UUID bookingId, UUID partnerId) {
        return details.lines(bookingId, partnerId).stream().map(line -> new ManagementViews.BookingLine(
                line.getId(), line.getAccommodationId(), line.getAccommodationName(), line.getRoomId(),
                line.getRoomName(), line.getCheckIn(), line.getCheckOut(), line.getQuantity(), line.getGuests(), line.getSubtotal())).toList();
    }
}
