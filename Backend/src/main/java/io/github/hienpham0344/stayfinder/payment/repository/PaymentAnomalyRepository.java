package io.github.hienpham0344.stayfinder.payment.repository;
import io.github.hienpham0344.stayfinder.payment.entity.PaymentAnomaly;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public interface PaymentAnomalyRepository extends JpaRepository<PaymentAnomaly,UUID> {
    @Modifying
    @Query(value="insert into payment_anomalies(id,payment_id,booking_id,transaction_id,reason,amount,created_at) "
            + "values (:id,:paymentId,:bookingId,:transactionId,:reason,:amount,:createdAt) on conflict (id) do nothing",nativeQuery=true)
    int insertOnce(@Param("id") UUID id,@Param("paymentId") UUID paymentId,@Param("bookingId") UUID bookingId,
                   @Param("transactionId") String transactionId,@Param("reason") String reason,
                   @Param("amount") BigDecimal amount,@Param("createdAt") Instant createdAt);
}
