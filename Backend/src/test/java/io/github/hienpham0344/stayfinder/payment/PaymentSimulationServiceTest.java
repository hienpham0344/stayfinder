package io.github.hienpham0344.stayfinder.payment;

import io.github.hienpham0344.stayfinder.booking.entity.*;
import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.booking.service.BookingTransactionLocks;
import io.github.hienpham0344.stayfinder.common.audit.AuditService;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;
import io.github.hienpham0344.stayfinder.payment.dto.SimulationOutcome;
import io.github.hienpham0344.stayfinder.payment.entity.*;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.payment.service.*;
import io.github.hienpham0344.stayfinder.reward.service.RewardReservationOperations;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class PaymentSimulationServiceTest {
    final UUID owner = UUID.randomUUID();
    final BookingRepository bookings = mock(BookingRepository.class);
    final PaymentRepository payments = mock(PaymentRepository.class);
    final BookingTransactionLocks bookingLocks = mock(BookingTransactionLocks.class);
    final PaymentTransactionLocks paymentLocks = mock(PaymentTransactionLocks.class);
    final PaymentSimulationAttemptRepository attempts = mock(PaymentSimulationAttemptRepository.class);
    final RewardReservationOperations benefits = mock(RewardReservationOperations.class);
    final IdempotencyService idem = mock(IdempotencyService.class);
    final AuditService audit = mock(AuditService.class);
    final DomainEventPublisher events = mock(DomainEventPublisher.class);
    final Clock clock = Clock.fixed(Instant.parse("2026-11-09T00:00:00Z"), ZoneOffset.UTC);
    final Booking booking = new Booking();
    final Payment payment = new Payment();

    PaymentSimulationService service(boolean enabled) {
        return new PaymentSimulationService(enabled, bookings, payments, bookingLocks, paymentLocks,
                attempts, benefits, idem, audit, events, clock);
    }

    @BeforeEach void setup() {
        booking.setId(UUID.randomUUID()); booking.setUserId(owner);
        booking.setStatus(BookingStatus.CONFIRMED); booking.setPaymentMethod("pay_at_property");
        booking.setPaymentStatus("pending"); booking.setTotalPriceCents(62000L);
        payment.setId(UUID.randomUUID()); payment.setUserId(owner); payment.setBookingId(booking.getId());
        payment.setMethod("pay_at_property"); payment.setStatus(PaymentStatus.PENDING);
        payment.setOriginalAmountCents(62000L);
        when(bookingLocks.lockOwnedBooking(owner, booking.getId()))
                .thenReturn(new BookingTransactionLocks.BookingResources(booking, new BookingQuote()));
        when(paymentLocks.lockClassified(booking)).thenReturn(payment);
        when(idem.fingerprint(any())).thenReturn("a".repeat(64));
        when(idem.execute(eq(owner), anyString(), anyString(), anyString(), any(), any()))
                .thenAnswer(i -> ((Supplier<?>) i.getArgument(5)).get());
    }

    @Test void disabledSimulationDoesNotAcquireLocksOrWriteAnything() {
        var error = assertThrows(BusinessException.class,
                () -> service(false).simulate(owner, booking.getId(), SimulationOutcome.SUCCESS, "one"));
        assertEquals(ErrorCode.FORBIDDEN, error.getErrorCode());
        verifyNoInteractions(bookingLocks, paymentLocks, attempts, benefits, audit, events, idem);
    }

    @Test void failureAndCancelKeepBookingUnpaidAndRetryCanSucceedOnce() {
        var service = service(true);
        var failed = service.simulate(owner, booking.getId(), SimulationOutcome.FAILURE, "failure");
        assertEquals("pending", failed.paymentStatus());
        assertEquals(SimulationOutcome.FAILURE, failed.outcome());
        assertTrue(failed.isDemo());
        service.simulate(owner, booking.getId(), SimulationOutcome.CANCEL, "cancel");
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());
        assertNull(booking.getPaidAt());
        verifyNoInteractions(benefits, payments, events);
        var success = service.simulate(owner, booking.getId(), SimulationOutcome.SUCCESS, "retry");
        assertEquals("success", success.paymentStatus());
        assertEquals(clock.instant(), payment.getCollectedAt());
        assertEquals(payment.getCollectedAt(), booking.getPaidAt());
        assertEquals("success", booking.getPaymentStatus());
        assertThrows(BusinessException.class,
                () -> service.simulate(owner, booking.getId(), SimulationOutcome.SUCCESS, "another-key"));
        assertThrows(BusinessException.class,
                () -> service.simulate(owner, booking.getId(), SimulationOutcome.FAILURE, "late-failure"));
        verify(benefits, times(1)).consume(booking.getId());
        verify(events, times(1)).publish("booking_paid", owner, booking.getId(), clock.instant());
        var saved = ArgumentCaptor.forClass(PaymentSimulationAttempt.class);
        verify(attempts, times(3)).save(saved.capture());
        assertEquals(List.of(SimulationOutcome.FAILURE, SimulationOutcome.CANCEL, SimulationOutcome.SUCCESS),
                saved.getAllValues().stream().map(PaymentSimulationAttempt::getOutcome).toList());
        assertTrue(saved.getAllValues().stream().allMatch(a -> owner.equals(a.getUserId())));
    }

    @Test void bankTransferAndCancelledBookingsCannotBeSettledBySimulator() {
        booking.setPaymentMethod("bank_transfer");
        assertThrows(BusinessException.class,
                () -> service(true).simulate(owner, booking.getId(), SimulationOutcome.SUCCESS, "bank"));
        booking.setPaymentMethod("pay_at_property"); booking.setStatus(BookingStatus.CANCELLED);
        assertThrows(BusinessException.class,
                () -> service(true).simulate(owner, booking.getId(), SimulationOutcome.SUCCESS, "cancelled"));
        verifyNoInteractions(attempts, benefits, payments, audit, events);
    }

    @Test void foreignBookingMustPassOwnerScopedLockBeforeMutation() {
        when(bookingLocks.lockOwnedBooking(owner, booking.getId()))
                .thenThrow(new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        var error = assertThrows(BusinessException.class,
                () -> service(true).simulate(owner, booking.getId(), SimulationOutcome.SUCCESS, "foreign"));
        assertEquals(ErrorCode.BOOKING_NOT_FOUND, error.getErrorCode());
        verifyNoInteractions(paymentLocks, attempts, benefits, payments, audit, events);
    }

    @Test void historyChecksOwnershipAndPaginationBeforeReadingAttemptRows() {
        assertEquals(ErrorCode.VALIDATION_ERROR, assertThrows(BusinessException.class,
                () -> service(true).history(owner, booking.getId(), 0, 101)).getErrorCode());
        when(bookings.findByIdAndUserId(booking.getId(), owner)).thenReturn(Optional.empty());
        assertEquals(ErrorCode.BOOKING_NOT_FOUND, assertThrows(BusinessException.class,
                () -> service(true).history(owner, booking.getId(), 0, 20)).getErrorCode());
        verifyNoInteractions(attempts);
    }

    @Test void inconsistentPaidSnapshotCannotBeOverwritten() {
        booking.setPaidAt(clock.instant());
        assertThrows(BusinessException.class,
                () -> service(true).simulate(owner, booking.getId(), SimulationOutcome.FAILURE, "bad"));
        verifyNoInteractions(attempts, benefits, payments, events);
    }
}
