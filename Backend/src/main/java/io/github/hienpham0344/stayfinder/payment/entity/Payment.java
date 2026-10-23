package io.github.hienpham0344.stayfinder.payment.entity;
import jakarta.persistence.*;import lombok.*;import java.time.Instant;import java.util.UUID;import java.math.BigDecimal;
import io.github.hienpham0344.stayfinder.common.enums.*;
@Entity @Table(name="payments") @Getter @Setter @NoArgsConstructor
public class Payment {
 @Id private UUID id;
 @Column(name="booking_id") private UUID bookingId;
 @Column(name="payment_method_id") private UUID paymentMethodId;
 @Column(name="user_id") private UUID userId;
 private BigDecimal amount;
 @Column(name="transaction_id") private String transactionId;
 @Convert(converter=PaymentStatusConverter.class) private PaymentStatus status;
 @Column(name="created_at") private Instant createdAt;
 @Column(name="original_amount_cents") private Long originalAmountCents;
 private String method;
 private String provider;
 private String environment;
 @Column(name="expires_at") private Instant expiresAt;
 @Column(name="collected_at") private Instant collectedAt;
 @Column(name="reconciliation_status") private String reconciliationStatus;
 @Column(name="refund_status") private String refundStatus;
 @Column(name="settlement_vnd") private Long settlementVnd;
 @Column(name="usd_to_vnd_rate") private String usdToVndRate;
 @Column(name="rate_version") private String rateVersion;
 @Column(name="transfer_reference") private String transferReference;
 @Column(name="bank_name") private String bankName;
 @Column(name="bank_code") private String bankCode;
 @Column(name="bank_account_number") private String bankAccountNumber;
 @Column(name="bank_sub_account") private String bankSubAccount;
 @Column(name="bank_account_holder") private String bankAccountHolder;
 @Column(name="qr_image_url") private String qrImageUrl;
}
