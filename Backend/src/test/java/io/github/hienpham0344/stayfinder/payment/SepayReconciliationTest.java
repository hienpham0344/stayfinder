package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.payment.service.*;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class SepayReconciliationTest {
    private final PaymentRepository payments=mock(PaymentRepository.class);
    private final BookingPaymentOperations bookings=mock(BookingPaymentOperations.class);
    private final PaymentProvider provider=mock(PaymentProvider.class);
    private final PaymentAnomalyRecorder anomalies=mock(PaymentAnomalyRecorder.class);
    private final Instant now=Instant.parse("2030-06-01T00:00:00Z");
    private final SepayWebhookService service=new SepayWebhookService(provider,JsonMapper.builder().build(),new SepayWebhookProcessor(payments,bookings,"123",Clock.fixed(now,ZoneOffset.UTC)),anomalies);
    @Test void signedLateTransferIsRetainedButCannotConfirmExpiredBooking() {
        UUID id=UUID.randomUUID(),booking=UUID.randomUUID();byte[] body=body(PaymentCode.fromId(id));
        when(provider.verifySignedWebhook(body,"123","valid")).thenReturn(true);when(payments.findBookingIdById(id)).thenReturn(Optional.of(booking));
        when(bookings.findForUpdate(booking)).thenReturn(Optional.of(new BookingPaymentView(booking,UUID.randomUUID(),BigDecimal.valueOf(100000),BookingStatus.PENDING,now)));
        Payment p=new Payment();p.setId(id);p.setBookingId(booking);p.setStatus(PaymentStatus.PENDING);p.setAmount(BigDecimal.valueOf(100000));when(payments.findById(id)).thenReturn(Optional.of(p));
        assertThrows(BusinessException.class,() -> service.handle(body,"123","valid"));
        verify(anomalies).record(id,booking,"77",BigDecimal.valueOf(100000),"BOOKING_NOT_PAYABLE");verify(bookings,never()).confirm(any());assertEquals(PaymentStatus.PENDING,p.getStatus());
    }
    @Test void signedTransferWithUnknownCodeIsRecordedForReconciliation() {
        UUID id=UUID.randomUUID();byte[] body=body(PaymentCode.fromId(id));when(provider.verifySignedWebhook(body,"123","valid")).thenReturn(true);
        assertThrows(BusinessException.class,() -> service.handle(body,"123","valid"));
        verify(anomalies).record(id,null,"77",BigDecimal.valueOf(100000),"PAYMENT_NOT_FOUND");verifyNoInteractions(bookings);
    }
    @Test void invalidPaymentCodeIsRecordedButUnsignedPayloadNeverIs() {
        byte[] body=body("invalid");when(provider.verifySignedWebhook(body,"123","valid")).thenReturn(true);
        assertThrows(BusinessException.class,() -> service.handle(body,"123","valid"));verify(anomalies).record(null,null,"77",BigDecimal.valueOf(100000),"INVALID_PAYMENT_CODE");
        reset(anomalies);assertThrows(BusinessException.class,() -> service.handle(body,"123","wrong"));verifyNoInteractions(anomalies);
    }
    @Test void anomalyRetriesUseSamePrimaryKeyForUnknownPayments() {
        PaymentAnomalyRepository repo=mock(PaymentAnomalyRepository.class);PaymentAnomalyRecorder recorder=new PaymentAnomalyRecorder(repo,Clock.fixed(now,ZoneOffset.UTC));
        recorder.record(null,null,"77",BigDecimal.valueOf(100000),"INVALID_PAYMENT_CODE");recorder.record(null,null,"77",BigDecimal.valueOf(100000),"INVALID_PAYMENT_CODE");
        var captor=org.mockito.ArgumentCaptor.forClass(UUID.class);verify(repo,times(2)).insertOnce(captor.capture(),isNull(),isNull(),eq("77"),eq("INVALID_PAYMENT_CODE"),eq(BigDecimal.valueOf(100000)),eq(now));
        assertEquals(captor.getAllValues().get(0),captor.getAllValues().get(1));
    }
    private byte[] body(String code) { return ("{\"id\":77,\"code\":\""+code+"\",\"transferType\":\"in\",\"transferAmount\":100000,\"accountNumber\":\"123\"}").getBytes(StandardCharsets.UTF_8); }
}
