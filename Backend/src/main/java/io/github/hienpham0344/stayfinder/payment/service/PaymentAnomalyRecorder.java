package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.entity.PaymentAnomaly;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentAnomalyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.math.BigDecimal;
import java.time.Clock;
import java.util.UUID;
@Service
public class PaymentAnomalyRecorder {
    private final PaymentAnomalyRepository repository;
    private final Clock clock;
    public PaymentAnomalyRecorder(PaymentAnomalyRepository repository,Clock clock) { this.repository=repository;this.clock=clock; }
    @Transactional
    public void record(UUID paymentId,UUID bookingId,String transactionId,BigDecimal amount,String reason) {
        // Stable primary key also deduplicates events with unknown payment IDs (SQL UNIQUE treats NULL separately).
        UUID id=UUID.nameUUIDFromBytes((transactionId+":"+paymentId+":"+reason).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        repository.insertOnce(id,paymentId,bookingId,transactionId,reason,amount,clock.instant());
    }
}
