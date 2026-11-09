package io.github.hienpham0344.stayfinder.payment.service;

import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentOperations;
import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentView;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class SepayWebhookService {
    private final PaymentRepository paymentRepository;
    private final BookingPaymentOperations bookingPaymentOperations;
    private final PaymentProvider paymentProvider;
    private final JsonMapper jsonMapper;
    private final String receivingAccountNumber;

    public SepayWebhookService(PaymentRepository paymentRepository,
                               BookingPaymentOperations bookingPaymentOperations,
                               PaymentProvider paymentProvider, JsonMapper jsonMapper,
                               @Value("${SEPAY_BANK_ACCOUNT_NUMBER:}") String receivingAccountNumber) {
        this.paymentRepository = paymentRepository;
        this.bookingPaymentOperations = bookingPaymentOperations;
        this.paymentProvider = paymentProvider;
        this.jsonMapper = jsonMapper;
        this.receivingAccountNumber = receivingAccountNumber;
    }

    @Transactional
    public void handle(byte[] rawBody, String timestamp, String signature) {
        if (!paymentProvider.verifySignedWebhook(rawBody, timestamp, signature)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        JsonNode event = parseEvent(rawBody);
        if (!"in".equals(event.path("transferType").asText())
                || receivingAccountNumber.isBlank()
                || !receivingAccountNumber.equals(event.path("accountNumber").asText())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        UUID paymentId;
        try {
            paymentId = PaymentCode.toId(event.path("code").asText());
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        BookingPaymentView booking = bookingPaymentOperations.findForUpdate(payment.getBookingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        BigDecimal amount = BigDecimal.valueOf(event.path("transferAmount").longValue());
        if (payment.getAmount() == null || booking.totalPrice() == null
                || payment.getAmount().compareTo(amount) != 0
                || booking.totalPrice().compareTo(amount) != 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        String transactionId = Long.toString(event.path("id").longValue());
        Payment existingTransaction = paymentRepository.findByTransactionId(transactionId).orElse(null);
        if (existingTransaction != null) {
            if (paymentId.equals(existingTransaction.getId())
                    && existingTransaction.getStatus() == PaymentStatus.SUCCESS) return;
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
        if (payment.getStatus() != PaymentStatus.PENDING || booking.status() != BookingStatus.PENDING) {
            throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
        }
        payment.setTransactionId(transactionId);
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);
        bookingPaymentOperations.confirm(booking.id());
    }

    private JsonNode parseEvent(byte[] rawBody) {
        final JsonNode event;
        try {
            event = jsonMapper.readTree(rawBody);
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        if (event == null || !event.isObject()
                || !positiveLong(event.path("id"))
                || !positiveLong(event.path("transferAmount"))
                || !event.path("code").isTextual()
                || !event.path("accountNumber").isTextual()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        return event;
    }

    private boolean positiveLong(JsonNode value) {
        return value.isIntegralNumber() && value.canConvertToLong() && value.longValue() > 0;
    }
}
