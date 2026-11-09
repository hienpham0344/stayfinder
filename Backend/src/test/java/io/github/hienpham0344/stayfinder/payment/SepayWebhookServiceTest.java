package io.github.hienpham0344.stayfinder.payment;

import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentOperations;
import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentView;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.payment.service.PaymentCode;
import io.github.hienpham0344.stayfinder.payment.service.PaymentProvider;
import io.github.hienpham0344.stayfinder.payment.service.SepayWebhookService;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class SepayWebhookServiceTest {
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final BookingPaymentOperations bookings = mock(BookingPaymentOperations.class);
    private final PaymentProvider provider = mock(PaymentProvider.class);
    private final SepayWebhookService service = new SepayWebhookService(
            payments, bookings, provider, JsonMapper.builder().build(), "1234567890");

    @Test
    void matchingIncomingTransactionConfirmsBookingOnce() {
        UUID bookingId = UUID.randomUUID();
        Payment payment = payment(bookingId);
        byte[] body = body(payment.getId(), 500000, "1234567890");
        when(provider.verifySignedWebhook(body, "123", "sha256=valid")).thenReturn(true);
        when(payments.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(bookings.findForUpdate(bookingId)).thenReturn(Optional.of(
                new BookingPaymentView(bookingId, UUID.randomUUID(), new BigDecimal("500000"), BookingStatus.PENDING)));
        when(payments.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.handle(body, "123", "sha256=valid");

        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals("92704", payment.getTransactionId());
        verify(bookings).confirm(bookingId);
    }

    @Test
    void wrongReceivingAccountNeverConfirmsBooking() {
        Payment payment = payment(UUID.randomUUID());
        byte[] body = body(payment.getId(), 500000, "9999999999");
        when(provider.verifySignedWebhook(body, "123", "sha256=valid")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.handle(body, "123", "sha256=valid"));
        verifyNoInteractions(payments, bookings);
    }

    @Test
    void repeatedTransactionDoesNotConfirmTwice() {
        UUID bookingId = UUID.randomUUID();
        Payment payment = payment(bookingId);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionId("92704");
        byte[] body = body(payment.getId(), 500000, "1234567890");
        when(provider.verifySignedWebhook(body, "123", "sha256=valid")).thenReturn(true);
        when(payments.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(bookings.findForUpdate(bookingId)).thenReturn(Optional.of(
                new BookingPaymentView(bookingId, UUID.randomUUID(), new BigDecimal("500000"), BookingStatus.CONFIRMED)));
        when(payments.findByTransactionId("92704")).thenReturn(Optional.of(payment));

        service.handle(body, "123", "sha256=valid");

        verify(payments, never()).save(any());
        verify(bookings, never()).confirm(any());
    }

    @Test
    void incorrectAmountDoesNotMarkPaymentSuccessful() {
        UUID bookingId = UUID.randomUUID();
        Payment payment = payment(bookingId);
        byte[] body = body(payment.getId(), 499999, "1234567890");
        when(provider.verifySignedWebhook(body, "123", "sha256=valid")).thenReturn(true);
        when(payments.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(bookings.findForUpdate(bookingId)).thenReturn(Optional.of(
                new BookingPaymentView(bookingId, UUID.randomUUID(), new BigDecimal("500000"), BookingStatus.PENDING)));

        assertThrows(BusinessException.class, () -> service.handle(body, "123", "sha256=valid"));
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        verify(payments, never()).save(any());
    }

    @Test
    void cancelledBookingDoesNotBecomePaid() {
        UUID bookingId = UUID.randomUUID();
        Payment payment = payment(bookingId);
        byte[] body = body(payment.getId(), 500000, "1234567890");
        when(provider.verifySignedWebhook(body, "123", "sha256=valid")).thenReturn(true);
        when(payments.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(bookings.findForUpdate(bookingId)).thenReturn(Optional.of(
                new BookingPaymentView(bookingId, UUID.randomUUID(), new BigDecimal("500000"), BookingStatus.CANCELLED)));

        assertThrows(BusinessException.class, () -> service.handle(body, "123", "sha256=valid"));
        verify(payments, never()).save(any());
        verify(bookings, never()).confirm(any());
    }

    @Test
    void unsignedRequestIsRejectedBeforeParsing() {
        byte[] body = "{}".getBytes(StandardCharsets.UTF_8);

        assertThrows(BusinessException.class, () -> service.handle(body, "123", "invalid"));
        verifyNoInteractions(payments, bookings);
    }

    private Payment payment(UUID bookingId) {
        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setBookingId(bookingId);
        payment.setAmount(new BigDecimal("500000"));
        payment.setStatus(PaymentStatus.PENDING);
        return payment;
    }

    private byte[] body(UUID paymentId, long amount, String account) {
        String json = "{\"id\":92704,\"code\":\"" + PaymentCode.fromId(paymentId)
                + "\",\"transferType\":\"in\",\"transferAmount\":" + amount
                + ",\"accountNumber\":\"" + account + "\"}";
        return json.getBytes(StandardCharsets.UTF_8);
    }
}
