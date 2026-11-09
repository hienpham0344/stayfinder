package io.github.hienpham0344.stayfinder.payment;

import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentOperations;
import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentView;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentMethodRepository;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.payment.service.PaymentCode;
import io.github.hienpham0344.stayfinder.payment.service.PaymentServiceImpl;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class PaymentServiceTest {
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final PaymentMethodRepository methods = mock(PaymentMethodRepository.class);
    private final BookingPaymentOperations bookings = mock(BookingPaymentOperations.class);
    private final PaymentServiceImpl service = new PaymentServiceImpl(
            payments, methods, bookings, Mappers.getMapper(PaymentMapper.class), "123456789");

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void refusesPaymentForCancelledBooking() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = authenticate();
        when(bookings.findOwnedForUpdate(bookingId, userId)).thenReturn(Optional.of(
                new BookingPaymentView(bookingId, userId, BigDecimal.TEN, BookingStatus.CANCELLED)));

        assertThrows(BusinessException.class, () -> service.create(bookingId, null));
        verify(payments, never()).save(any());
    }

    @Test
    void refusesToIssueTransferInstructionsWithoutReceivingAccount() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = authenticate();
        when(bookings.findOwnedForUpdate(bookingId, userId)).thenReturn(Optional.of(
                new BookingPaymentView(bookingId, userId, BigDecimal.TEN, BookingStatus.PENDING)));
        PaymentServiceImpl unconfigured = new PaymentServiceImpl(
                payments, methods, bookings, Mappers.getMapper(PaymentMapper.class), "");

        assertThrows(IllegalStateException.class, () -> unconfigured.create(bookingId, null));
        verify(payments, never()).save(any());
    }

    @Test
    void newPaymentAfterFailedAttemptKeepsOldHistoryAndReturnsCode() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = authenticate();
        when(bookings.findOwnedForUpdate(bookingId, userId)).thenReturn(Optional.of(
                new BookingPaymentView(bookingId, userId, new BigDecimal("500000"), BookingStatus.PENDING)));
        Payment failed = new Payment();
        failed.setId(UUID.randomUUID());
        failed.setStatus(PaymentStatus.FAILED);
        when(payments.findByBookingId(bookingId)).thenReturn(List.of(failed));
        when(payments.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(UUID.randomUUID());
            return payment;
        });

        var created = service.create(bookingId, null);

        assertEquals(PaymentStatus.FAILED, failed.getStatus());
        assertEquals(PaymentStatus.PENDING, created.status());
        assertEquals(PaymentCode.fromId(created.id()), created.paymentCode());
        assertEquals("123456789", created.receivingAccountNumber());
    }

    private UUID authenticate() {
        UUID userId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(userId, "user@example.com", UserRole.CUSTOMER), null, List.of()));
        return userId;
    }
}
