package io.github.hienpham0344.stayfinder.rewards.service;

import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.rewards.dto.RewardDtos;
import io.github.hienpham0344.stayfinder.rewards.entity.*;
import io.github.hienpham0344.stayfinder.rewards.repository.*;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class RewardsService implements BookingRewards {
    private final UserRepository users;
    private final RewardCatalogRepository catalog;
    private final RewardVoucherRepository vouchers;
    private final RewardLedgerRepository ledger;
    private final Clock clock;
    private final long earnVndPerPoint;

    public RewardsService(UserRepository users, RewardCatalogRepository catalog, RewardVoucherRepository vouchers,
                          RewardLedgerRepository ledger, Clock clock,
                          @Value("${stayfinder.rewards.earn-vnd-per-point:1000}") long earnVndPerPoint) {
        if (earnVndPerPoint < 1) throw new IllegalArgumentException("Rewards earning rate must be positive");
        this.users = users; this.catalog = catalog; this.vouchers = vouchers; this.ledger = ledger;
        this.clock = clock; this.earnVndPerPoint = earnVndPerPoint;
    }

    @Transactional(readOnly = true)
    public RewardDtos.Account account() {
        User user = users.findById(CurrentUser.require().id()).orElseThrow(() -> error(ErrorCode.USER_NOT_FOUND));
        return new RewardDtos.Account(balance(user), "VND", earnVndPerPoint);
    }

    @Transactional(readOnly = true)
    public Page<RewardDtos.Ledger> history(Pageable page) {
        return ledger.findByUserId(CurrentUser.require().id(), page).map(RewardDtos.Ledger::from);
    }

    @Transactional(readOnly = true)
    public Page<RewardDtos.Voucher> vouchers(Pageable page) {
        return vouchers.findByUserId(CurrentUser.require().id(), page).map(RewardDtos.Voucher::from);
    }

    @Transactional(readOnly = true)
    public Page<RewardDtos.Catalog> catalog(Pageable page) {
        return catalog.findByEnabledTrue(page).map(RewardDtos.Catalog::from);
    }

    @Transactional
    public RewardDtos.Voucher redeem(RewardDtos.Redeem request) {
        UUID userId = CurrentUser.require().id();
        User user = users.lockById(userId).orElseThrow(() -> error(ErrorCode.USER_NOT_FOUND));
        String key = "REDEEM:" + request.idempotencyKey();
        RewardLedger previous = ledger.findByUserIdAndIdempotencyKey(userId, key).orElse(null);
        if (previous != null) {
            RewardVoucher voucher = vouchers.findByIdAndUserId(previous.getSourceId(), userId)
                    .orElseThrow(() -> error(ErrorCode.DUPLICATE_RESOURCE));
            if (!voucher.getCatalogId().equals(request.catalogId())) throw error(ErrorCode.DUPLICATE_RESOURCE);
            return RewardDtos.Voucher.from(voucher);
        }
        RewardCatalog item = catalog.findById(request.catalogId()).filter(RewardCatalog::isEnabled)
                .orElseThrow(() -> error(ErrorCode.VALIDATION_ERROR));
        if (item.getPointsCost() < 1 || balance(user) < item.getPointsCost()) throw error(ErrorCode.VALIDATION_ERROR);
        RewardVoucher voucher = new RewardVoucher();
        voucher.setUserId(userId); voucher.setCatalogId(item.getId()); voucher.setPointsCost(item.getPointsCost());
        voucher.setDiscountAmount(item.getDiscountAmount()); voucher.setMinSpend(item.getMinSpend());
        voucher.setCreatedAt(clock.instant()); voucher.setExpiresAt(clock.instant().plus(Duration.ofDays(item.getValidityDays())));
        voucher = vouchers.save(voucher);
        append(user, -item.getPointsCost(), "REDEMPTION", voucher.getId(), key);
        return RewardDtos.Voucher.from(voucher);
    }

    @Override
    @Transactional
    public RewardDtos.Discount reserve(UUID voucherId, UUID userId, UUID bookingId, BigDecimal subtotal, Instant bookingExpiresAt) {
        if (voucherId == null) return RewardDtos.Discount.none();
        RewardVoucher voucher = vouchers.lockOwned(voucherId, userId).orElseThrow(() -> error(ErrorCode.VALIDATION_ERROR));
        Instant now = clock.instant();
        boolean free = voucher.getStatus() == RewardVoucher.Status.AVAILABLE
                || (voucher.getStatus() == RewardVoucher.Status.RESERVED && voucher.getReservedUntil() != null
                    && !voucher.getReservedUntil().isAfter(now));
        if (!free || !voucher.getExpiresAt().isAfter(now) || subtotal.compareTo(voucher.getMinSpend()) < 0
                || voucher.getDiscountAmount().signum() <= 0 || subtotal.compareTo(voucher.getDiscountAmount()) <= 0) {
            throw error(ErrorCode.VALIDATION_ERROR);
        }
        voucher.setStatus(RewardVoucher.Status.RESERVED); voucher.setBookingId(bookingId);
        // A voucher valid at checkout remains reserved for this booking's complete payment window.
        voucher.setReservedUntil(bookingExpiresAt);
        vouchers.save(voucher);
        return new RewardDtos.Discount(voucher.getId(), voucher.getDiscountAmount(),
                "FIXED_VND;minSpend=" + voucher.getMinSpend().toPlainString() + ";points=" + voucher.getPointsCost());
    }

    @Override
    @Transactional
    public void consume(UUID bookingId, UUID expectedVoucherId) {
        if (expectedVoucherId == null) return;
        RewardVoucher voucher = vouchers.lockByBooking(bookingId).filter(v -> expectedVoucherId.equals(v.getId()))
                .orElseThrow(() -> error(ErrorCode.BOOKING_INVALID_STATE));
        if (voucher.getStatus() == RewardVoucher.Status.USED) return;
        if (voucher.getStatus() != RewardVoucher.Status.RESERVED || voucher.getReservedUntil() == null
                || !voucher.getReservedUntil().isAfter(clock.instant())) throw error(ErrorCode.BOOKING_INVALID_STATE);
        voucher.setStatus(RewardVoucher.Status.USED); vouchers.save(voucher);
    }

    @Override
    @Transactional
    public void release(UUID bookingId) {
        vouchers.lockByBooking(bookingId).ifPresent(voucher -> {
            if (voucher.getStatus() != RewardVoucher.Status.RESERVED) return;
            voucher.setStatus(RewardVoucher.Status.AVAILABLE); voucher.setBookingId(null); voucher.setReservedUntil(null);
            vouchers.save(voucher);
        });
    }

    @Override
    @Transactional
    public void earnCompleted(UUID userId, UUID bookingId, BigDecimal paidAmount) {
        if (paidAmount == null || paidAmount.signum() < 0) throw error(ErrorCode.VALIDATION_ERROR);
        User user = users.lockById(userId).orElseThrow(() -> error(ErrorCode.USER_NOT_FOUND));
        String key = "COMPLETED:" + bookingId;
        if (ledger.findByUserIdAndIdempotencyKey(userId, key).isPresent()) return;
        long points = paidAmount.divideToIntegralValue(BigDecimal.valueOf(earnVndPerPoint)).longValueExact();
        append(user, points, "COMPLETED", bookingId, key);
    }

    private void append(User user, long delta, String sourceType, UUID sourceId, String key) {
        long newBalance = (long) balance(user) + delta;
        if (newBalance < 0 || newBalance > Integer.MAX_VALUE) throw error(ErrorCode.VALIDATION_ERROR);
        user.setLoyaltyPoints((int) newBalance); users.save(user);
        RewardLedger entry = new RewardLedger();
        entry.setUserId(user.getId()); entry.setDelta(delta); entry.setBalanceAfter((int) newBalance);
        entry.setSourceType(sourceType); entry.setSourceId(sourceId); entry.setIdempotencyKey(key); entry.setCreatedAt(clock.instant());
        ledger.save(entry);
    }

    private int balance(User user) { return user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints(); }
    private BusinessException error(ErrorCode code) { return new BusinessException(code); }
}
