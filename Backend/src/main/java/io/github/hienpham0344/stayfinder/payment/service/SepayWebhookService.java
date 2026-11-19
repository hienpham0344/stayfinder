package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class SepayWebhookService {
    private final PaymentProvider paymentProvider;
    private final JsonMapper jsonMapper;
    private final SepayWebhookProcessor processor;
    private final PaymentAnomalyRecorder anomalies;
    public SepayWebhookService(PaymentProvider paymentProvider,JsonMapper jsonMapper,
                               SepayWebhookProcessor processor,PaymentAnomalyRecorder anomalies) {
        this.paymentProvider=paymentProvider;this.jsonMapper=jsonMapper;this.processor=processor;this.anomalies=anomalies;
    }
    @Transactional(propagation=Propagation.NEVER)
    public void handle(byte[] rawBody,String timestamp,String signature) {
        if (!paymentProvider.verifySignedWebhook(rawBody,timestamp,signature)) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        JsonNode event=parseEvent(rawBody);
        try {
            processor.process(event);
        } catch (SepayWebhookProcessor.Rejection rejection) {
            // The processor proxy has already rolled back and released its connection before reconciliation starts.
            anomalies.record(rejection.paymentId(),rejection.bookingId(),rejection.transactionId(),rejection.amount(),rejection.reason());
            throw rejection;
        } catch (org.springframework.dao.DataIntegrityViolationException conflict) {
            // A concurrent transaction can win a provider transaction ID on another booking.
            java.util.UUID paymentId = null;
            try { paymentId = PaymentCode.toId(event.path("code").asText()); }
            catch (IllegalArgumentException ignored) { /* Unknown reference is retained as null. */ }
            anomalies.record(paymentId, null, Long.toString(event.path("id").longValue()),
                    java.math.BigDecimal.valueOf(event.path("transferAmount").longValue()), "TRANSACTION_CONFLICT");
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
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
