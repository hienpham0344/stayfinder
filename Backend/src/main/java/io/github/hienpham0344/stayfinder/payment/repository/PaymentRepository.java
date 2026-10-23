package io.github.hienpham0344.stayfinder.payment.repository;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;
import java.util.*;
public interface PaymentRepository extends JpaRepository<Payment,UUID>{
 List<Payment> findByBookingId(UUID bookingId);
 Optional<Payment> findByIdAndUserId(UUID id,UUID userId);
 Optional<Payment> findByTransferReference(String transferReference);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Payment p where p.id=:id") Optional<Payment> lockById(@Param("id") UUID id);
}
