package io.github.hienpham0344.stayfinder.payment.repository;
import io.github.hienpham0344.stayfinder.payment.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RefundRequestRepository extends JpaRepository<RefundRequest,UUID> {Optional<RefundRequest> findByBookingId(UUID bookingId);
 @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
 @org.springframework.data.jpa.repository.Query("select r from RefundRequest r where r.id=:id")
 Optional<RefundRequest> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
}
