package io.github.hienpham0344.stayfinder.rewards.repository;
import io.github.hienpham0344.stayfinder.rewards.entity.RewardVoucher;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;
public interface RewardVoucherRepository extends JpaRepository<RewardVoucher, UUID> {
    Page<RewardVoucher> findByUserId(UUID userId, Pageable pageable);
    Optional<RewardVoucher> findByIdAndUserId(UUID id, UUID userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from RewardVoucher v where v.id = :id and v.userId = :userId")
    Optional<RewardVoucher> lockOwned(@Param("id") UUID id, @Param("userId") UUID userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from RewardVoucher v where v.bookingId = :bookingId")
    Optional<RewardVoucher> lockByBooking(@Param("bookingId") UUID bookingId);
}
