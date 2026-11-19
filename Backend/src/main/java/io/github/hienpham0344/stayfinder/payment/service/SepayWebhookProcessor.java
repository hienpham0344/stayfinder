package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.booking.service.*;
import io.github.hienpham0344.stayfinder.common.enums.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Clock;
import java.util.UUID;

@Service
public class SepayWebhookProcessor {
    private final PaymentRepository paymentRepository;
    private final BookingPaymentOperations bookingPaymentOperations;
    private final String receivingAccountNumber;
    private final Clock clock;
    public SepayWebhookProcessor(PaymentRepository paymentRepository, BookingPaymentOperations bookingPaymentOperations,
                                 @Value("${SEPAY_BANK_ACCOUNT_NUMBER:}") String receivingAccountNumber, Clock clock) {
        this.paymentRepository=paymentRepository;this.bookingPaymentOperations=bookingPaymentOperations;
        this.receivingAccountNumber=receivingAccountNumber;this.clock=clock;
    }
    @Transactional
    public void process(JsonNode event) {
        if (!"in".equals(event.path("transferType").asText())
                || receivingAccountNumber.isBlank()
                || !receivingAccountNumber.equals(event.path("accountNumber").asText())) {
            throw rejection(null,null,event,"ACCOUNT_OR_DIRECTION_MISMATCH",ErrorCode.VALIDATION_ERROR);
        }
        UUID paymentId;
        try {
            paymentId = PaymentCode.toId(event.path("code").asText());
        } catch (IllegalArgumentException exception) {
            throw rejection(null,null,event,"INVALID_PAYMENT_CODE",ErrorCode.VALIDATION_ERROR);
        }
        UUID bookingId = paymentRepository.findBookingIdById(paymentId).orElse(null);
        if (bookingId == null) {
            throw rejection(paymentId,null,event,"PAYMENT_NOT_FOUND",ErrorCode.PAYMENT_NOT_FOUND);
        }
        BookingPaymentView booking = bookingPaymentOperations.findForUpdate(bookingId).orElse(null);
        if (booking == null) {
            throw rejection(paymentId,bookingId,event,"BOOKING_NOT_FOUND",ErrorCode.BOOKING_NOT_FOUND);
        }
        // Load the entity only after the booking lock: a waiting concurrent replay must see committed payment status.
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        BigDecimal amount = BigDecimal.valueOf(event.path("transferAmount").longValue());
        if (payment.getAmount() == null || booking.totalPrice() == null
                || payment.getAmount().compareTo(amount) != 0
                || booking.totalPrice().compareTo(amount) != 0) {
            throw rejection(paymentId,booking.id(),event,"AMOUNT_MISMATCH",ErrorCode.VALIDATION_ERROR);
        }
        String transactionId = Long.toString(event.path("id").longValue());
        Payment existingTransaction = paymentRepository.findByTransactionId(transactionId).orElse(null);
        if (existingTransaction != null) {
            if (paymentId.equals(existingTransaction.getId())
                    && existingTransaction.getStatus() == PaymentStatus.SUCCESS) return;
            throw rejection(paymentId,booking.id(),event,"TRANSACTION_REUSED",ErrorCode.DUPLICATE_RESOURCE);
        }
        if (payment.getStatus() != PaymentStatus.PENDING || booking.status() != BookingStatus.PENDING
                || booking.expiredAt(clock.instant())) {
            throw rejection(paymentId,booking.id(),event,"BOOKING_NOT_PAYABLE",ErrorCode.BOOKING_INVALID_STATE);
        }
        payment.setTransactionId(transactionId);
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);
        try {
            bookingPaymentOperations.confirm(booking.id());
        } catch (BusinessException exception) {
            throw rejection(paymentId,booking.id(),event,"BOOKING_NOT_PAYABLE",exception.getErrorCode());
        }
    }

    private Rejection rejection(UUID paymentId, UUID bookingId, JsonNode event, String reason, ErrorCode code) {
        return new Rejection(code,paymentId,bookingId,Long.toString(event.path("id").longValue()),
                BigDecimal.valueOf(event.path("transferAmount").longValue()),reason);
    }

    public static class Rejection extends BusinessException {
        private final UUID paymentId;
        private final UUID bookingId;
        private final String transactionId;
        private final BigDecimal amount;
        private final String reason;
        public Rejection(ErrorCode code,UUID paymentId,UUID bookingId,String transactionId,BigDecimal amount,String reason) {
            super(code);this.paymentId=paymentId;this.bookingId=bookingId;this.transactionId=transactionId;this.amount=amount;this.reason=reason;
        }
        public UUID paymentId() { return paymentId; }
        public UUID bookingId() { return bookingId; }
        public String transactionId() { return transactionId; }
        public BigDecimal amount() { return amount; }
        public String reason() { return reason; }
    }
}
