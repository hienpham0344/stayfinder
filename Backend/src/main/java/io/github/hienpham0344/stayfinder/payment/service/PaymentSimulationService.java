package io.github.hienpham0344.stayfinder.payment.service;

import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingTransactionLocks;
import io.github.hienpham0344.stayfinder.common.audit.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.payment.entity.PaymentSimulationAttempt;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentSimulationAttemptRepository;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.UUID;

@Service
@PreAuthorize("hasRole('CUSTOMER')")
public class PaymentSimulationService {
    private final boolean enabled;
    private final BookingRepository bookings;
    private final PaymentRepository payments;
    private final BookingTransactionLocks bookingLocks;
    private final PaymentTransactionLocks paymentLocks;
    private final PaymentSimulationAttemptRepository attempts;
    private final RewardReservationOperations benefits;
    private final IdempotencyService idempotency;
    private final AuditService audit;
    private final DomainEventPublisher events;
    private final Clock clock;

    public PaymentSimulationService(@Value("${stayfinder.payment-simulation.enabled:false}") boolean enabled,
            BookingRepository bookings, PaymentRepository payments, BookingTransactionLocks bookingLocks,
            PaymentTransactionLocks paymentLocks, PaymentSimulationAttemptRepository attempts,
            RewardReservationOperations benefits, IdempotencyService idempotency, AuditService audit,
            DomainEventPublisher events, Clock clock) {
        this.enabled = enabled;
        this.bookings = bookings;
        this.payments = payments;
        this.bookingLocks = bookingLocks;
        this.paymentLocks = paymentLocks;
        this.attempts = attempts;
        this.benefits = benefits;
        this.idempotency = idempotency;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    @Transactional
    public PaymentSimulationResponse simulate(UUID owner, UUID bookingId, SimulationOutcome outcome, String key) {
        requireEnabled();
        if (outcome == null) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        record Intent(UUID bookingId, SimulationOutcome outcome) {}
        return idempotency.execute(owner, "payment:simulate", key,
                idempotency.fingerprint(new Intent(bookingId, outcome)), PaymentSimulationResponse.class, () -> {
            // Use the same owner -> room -> booking -> payment lock order as cancellation and settlement.
            var booking = bookingLocks.lockOwnedBooking(owner, bookingId).booking();
            var payment = paymentLocks.lockClassified(booking);
            if (!owner.equals(booking.getUserId()) || !"pay_at_property".equals(booking.getPaymentMethod())
                    || booking.getStatus() != BookingStatus.CONFIRMED
                    || payment.getStatus() != PaymentStatus.PENDING || booking.getPaidAt() != null
                    || payment.getCollectedAt() != null || !"pending".equals(booking.getPaymentStatus())) {
                throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
            }
            var now = clock.instant();
            if (outcome == SimulationOutcome.SUCCESS) {
                benefits.consume(bookingId);
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setCollectedAt(now);
                payments.save(payment);
                booking.setPaidAt(now);
                booking.setPaymentStatus("success");
                bookings.save(booking);
                events.publish("booking_paid", owner, bookingId, now);
            }
            // Failed/cancelled attempts leave the aggregate unpaid so a new attempt can retry.
            // Cancelling checkout deliberately does not cancel the confirmed reservation.
            var attempt = new PaymentSimulationAttempt();
            attempt.setId(UUID.randomUUID());
            attempt.setUserId(owner);
            attempt.setBookingId(bookingId);
            attempt.setPaymentId(payment.getId());
            attempt.setOutcome(outcome);
            attempt.setPaymentStatus(payment.getStatus().getValue());
            attempt.setCreatedAt(now);
            attempts.save(attempt);
            audit.record(owner, "payment_simulated_" + outcome.name().toLowerCase(java.util.Locale.ROOT), bookingId);
            return response(attempt);
        });
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentSimulationResponse> history(UUID owner, UUID bookingId, int page, int size) {
        requireEnabled();
        if (page < 0 || size < 1 || size > 100) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        bookings.findByIdAndUserId(bookingId, owner)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        var rows = attempts.findByBookingIdAndUserId(bookingId, owner,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id")));
        return new PageResponse<>(rows.getContent().stream().map(PaymentSimulationService::response).toList(),
                page, size, rows.getTotalElements(), rows.getTotalPages());
    }

    private void requireEnabled() {
        if (!enabled) throw new BusinessException(ErrorCode.FORBIDDEN);
    }

    private static PaymentSimulationResponse response(PaymentSimulationAttempt attempt) {
        return new PaymentSimulationResponse(attempt.getId(), attempt.getBookingId(), attempt.getPaymentId(),
                attempt.getOutcome(), attempt.getPaymentStatus(), attempt.getCreatedAt(), true);
    }
}
