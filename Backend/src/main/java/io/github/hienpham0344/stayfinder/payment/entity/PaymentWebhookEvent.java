package io.github.hienpham0344.stayfinder.payment.entity;
import jakarta.persistence.*;import lombok.*;import java.time.Instant;import java.util.UUID;import java.math.BigDecimal;
import io.github.hienpham0344.stayfinder.common.enums.*;
@Entity @Table(name="payment_webhook_events") @Getter @Setter @NoArgsConstructor
public class PaymentWebhookEvent {
 @Id private UUID id;
 private String provider;
 private String environment;
 @Column(name="event_id") private String eventId;
 @Column(name="payload_hash") private String payloadHash;
 private String gateway;
 @Column(name="transaction_at") private Instant transactionAt;
 @Column(name="account_number") private String accountNumber;
 @Column(name="sub_account") private String subAccount;
 private String code;
 private String content;
 @Column(name="transfer_type") private String transferType;
 @Column(name="transfer_amount") private long transferAmount;
 @Column(name="reference_code") private String referenceCode;
 @Column(name="received_at") private Instant receivedAt;
 @Column(name="processing_status") private String processingStatus;
 @Column(name="resolution_reason") private String resolutionReason;
 @Column(name="payment_id") private UUID paymentId;
 @Column(name="processed_at") private Instant processedAt;
 @Column(name="conflict_count") private int conflictCount;
 @Column(name="handled_conflict_count") private int handledConflictCount;
 @Column(name="last_conflict_hash") private String lastConflictHash;
 @Column(name="last_conflict_at") private Instant lastConflictAt;
}
