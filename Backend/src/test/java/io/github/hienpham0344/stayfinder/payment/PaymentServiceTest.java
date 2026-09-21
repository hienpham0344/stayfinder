package io.github.hienpham0344.stayfinder.payment;

import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentOperations;
import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentView;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.payment.dto.SepayWebhookRequest;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentMethodRepository;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.payment.service.PaymentProvider;
import io.github.hienpham0344.stayfinder.payment.service.PaymentServiceImpl;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTest {
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final PaymentMethodRepository paymentMethodRepository = mock(PaymentMethodRepository.class);
    private final BookingPaymentOperations bookingPaymentOperations = mock(BookingPaymentOperations.class);
    private final PaymentProvider provider = mock(PaymentProvider.class);
    private final PaymentServiceImpl service = new PaymentServiceImpl(paymentRepository, paymentMethodRepository,
            bookingPaymentOperations, provider, Mappers.getMapper(PaymentMapper.class));

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void duplicateVerifiedWebhookReturnsExistingPaymentWithoutRepeatingSideEffects() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setBookingId(bookingId);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionId("tx-1");
        payment.setAmount(BigDecimal.TEN);
        SepayWebhookRequest request = new SepayWebhookRequest(bookingId, "tx-1", BigDecimal.TEN,
                PaymentStatus.SUCCESS, "verified");
        when(paymentRepository.findByTransactionId("tx-1")).thenReturn(Optional.of(payment));
        when(provider.verifyWebhook(request)).thenReturn(true);

        assertEquals(payment.getId(), service.handleWebhook(request).id());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void verifiedSuccessWebhookConfirmsPendingBookingOnce() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        BookingPaymentView booking = new BookingPaymentView(bookingId, userId, BigDecimal.TEN, BookingStatus.PENDING);
        SepayWebhookRequest request = new SepayWebhookRequest(bookingId, "tx-2", BigDecimal.TEN,
                PaymentStatus.SUCCESS, "verified");
        when(provider.verifyWebhook(request)).thenReturn(true);
        when(paymentRepository.findByTransactionId("tx-2")).thenReturn(Optional.empty());
        when(bookingPaymentOperations.find(bookingId)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBookingId(bookingId)).thenReturn(List.of());
        Payment saved = new Payment();
        saved.setId(UUID.randomUUID());
        when(paymentRepository.save(any(Payment.class))).thenReturn(saved);

        service.handleWebhook(request);

        verify(paymentRepository).save(any(Payment.class));
        verify(bookingPaymentOperations).confirm(bookingId);
    }

    private void authenticate(UUID userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new io.github.hienpham0344.stayfinder.security.CurrentUser(userId, "user@example.com",
                        io.github.hienpham0344.stayfinder.common.enums.UserRole.CUSTOMER), null, List.of()));
    }
}
