package io.github.hienpham0344.stayfinder.payment.repository;
import io.github.hienpham0344.stayfinder.payment.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RefundRequestRepository extends JpaRepository<RefundRequest,UUID> {Optional<RefundRequest> findByBookingId(UUID bookingId);}
