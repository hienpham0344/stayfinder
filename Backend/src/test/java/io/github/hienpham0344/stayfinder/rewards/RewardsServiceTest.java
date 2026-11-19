package io.github.hienpham0344.stayfinder.rewards;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.rewards.dto.RewardDtos;
import io.github.hienpham0344.stayfinder.rewards.entity.*;
import io.github.hienpham0344.stayfinder.rewards.repository.*;
import io.github.hienpham0344.stayfinder.rewards.service.RewardsService;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RewardsServiceTest {
    private final UserRepository users=mock(UserRepository.class);
    private final RewardCatalogRepository catalog=mock(RewardCatalogRepository.class);
    private final RewardVoucherRepository vouchers=mock(RewardVoucherRepository.class);
    private final RewardLedgerRepository ledger=mock(RewardLedgerRepository.class);
    private final Instant now=Instant.parse("2030-06-01T00:00:00Z");
    private final RewardsService service=new RewardsService(users,catalog,vouchers,ledger,Clock.fixed(now,ZoneOffset.UTC),1000);
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void redemptionDebitsPointsAndSnapshotsVoucherTerms() {
        User user=user(1000); RewardCatalog item=item();
        when(catalog.findById(item.getId())).thenReturn(Optional.of(item));
        when(vouchers.save(any())).thenAnswer(i -> { RewardVoucher v=i.getArgument(0);v.setId(UUID.randomUUID());return v; });
        var voucher=service.redeem(new RewardDtos.Redeem(item.getId(),UUID.randomUUID()));
        assertEquals(0,user.getLoyaltyPoints()); assertEquals(new BigDecimal("10000"),voucher.discountAmount());
        assertEquals(now.plus(Duration.ofDays(30)),voucher.expiresAt());
        var capture=ArgumentCaptor.forClass(RewardLedger.class);verify(ledger).save(capture.capture());
        assertEquals(-1000,capture.getValue().getDelta());assertEquals(0,capture.getValue().getBalanceAfter());
    }
    @Test void insufficientBalanceNeverIssuesVoucherOrChangesBalance() {
        User user=user(999);RewardCatalog item=item();when(catalog.findById(item.getId())).thenReturn(Optional.of(item));
        assertThrows(BusinessException.class,() -> service.redeem(new RewardDtos.Redeem(item.getId(),UUID.randomUUID())));
        assertEquals(999,user.getLoyaltyPoints());verifyNoInteractions(vouchers);verify(ledger,never()).save(any());
    }
    @Test void retryReturnsSameVoucherWithoutSecondDebit() {
        User user=user(1000);UUID key=UUID.randomUUID();RewardVoucher voucher=voucher(user.getId());
        RewardLedger previous=new RewardLedger();previous.setSourceId(voucher.getId());
        when(ledger.findByUserIdAndIdempotencyKey(user.getId(),"REDEEM:"+key)).thenReturn(Optional.of(previous));
        when(vouchers.findByIdAndUserId(voucher.getId(),user.getId())).thenReturn(Optional.of(voucher));
        assertEquals(voucher.getId(),service.redeem(new RewardDtos.Redeem(voucher.getCatalogId(),key)).id());
        assertEquals(1000,user.getLoyaltyPoints());verify(users,never()).save(any());verify(ledger,never()).save(any());
    }
    @Test void completionEarnsFromActualPaidAmountAndRetryIsIdempotent() {
        User user=user(10);UUID bookingId=UUID.randomUUID();
        service.earnCompleted(user.getId(),bookingId,new BigDecimal("19999"));
        assertEquals(29,user.getLoyaltyPoints());
        when(ledger.findByUserIdAndIdempotencyKey(user.getId(),"COMPLETED:"+bookingId)).thenReturn(Optional.of(new RewardLedger()));
        service.earnCompleted(user.getId(),bookingId,new BigDecimal("19999"));
        assertEquals(29,user.getLoyaltyPoints());verify(ledger,times(1)).save(any());
    }
    @Test void reservedVoucherCannotBeUsedBySecondBooking() {
        UUID userId=UUID.randomUUID();RewardVoucher v=voucher(userId);v.setStatus(RewardVoucher.Status.RESERVED);v.setReservedUntil(now.plusSeconds(600));
        when(vouchers.lockOwned(v.getId(),userId)).thenReturn(Optional.of(v));
        assertThrows(BusinessException.class,() -> service.reserve(v.getId(),userId,UUID.randomUUID(),new BigDecimal("100000"),now.plusSeconds(900)));
        verify(vouchers,never()).save(any());
    }
    @Test void expiredReservationMayBeReusedButOldBookingCannotReleaseNewHold() {
        UUID userId=UUID.randomUUID();RewardVoucher v=voucher(userId);v.setStatus(RewardVoucher.Status.RESERVED);v.setReservedUntil(now);
        when(vouchers.lockOwned(v.getId(),userId)).thenReturn(Optional.of(v));UUID newBooking=UUID.randomUUID();
        var discount=service.reserve(v.getId(),userId,newBooking,new BigDecimal("100000"),now.plusSeconds(900));
        assertEquals(new BigDecimal("10000"),discount.amount());assertEquals(newBooking,v.getBookingId());
        service.release(UUID.randomUUID());assertEquals(RewardVoucher.Status.RESERVED,v.getStatus());
    }
    @Test void expiryAndMinimumSpendAreCheckedBeforeReserving() {
        UUID userId=UUID.randomUUID();RewardVoucher v=voucher(userId);when(vouchers.lockOwned(v.getId(),userId)).thenReturn(Optional.of(v));
        assertThrows(BusinessException.class,() -> service.reserve(v.getId(),userId,UUID.randomUUID(),new BigDecimal("99999"),now.plusSeconds(900)));
        v.setExpiresAt(now);
        assertThrows(BusinessException.class,() -> service.reserve(v.getId(),userId,UUID.randomUUID(),new BigDecimal("100000"),now.plusSeconds(900)));
        verify(vouchers,never()).save(any());
    }
    @Test void missingOrReassignedVoucherCannotConfirmDiscountedBooking() {
        UUID bookingId=UUID.randomUUID();UUID expectedVoucher=UUID.randomUUID();
        assertThrows(BusinessException.class,() -> service.consume(bookingId,expectedVoucher));
        verify(vouchers,never()).save(any());
    }
    @Test void releaseNeverResurrectsConsumedVoucher() {
        UUID bookingId=UUID.randomUUID();RewardVoucher v=voucher(UUID.randomUUID());v.setStatus(RewardVoucher.Status.USED);
        when(vouchers.lockByBooking(bookingId)).thenReturn(Optional.of(v));service.release(bookingId);
        assertEquals(RewardVoucher.Status.USED,v.getStatus());verify(vouchers,never()).save(any());
    }
    private User user(int points) {
        User u=new User();u.setId(UUID.randomUUID());u.setLoyaltyPoints(points);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new CurrentUser(u.getId(),"test@example.com",UserRole.CUSTOMER),null,List.of()));
        when(users.lockById(u.getId())).thenReturn(Optional.of(u));return u;
    }
    private RewardCatalog item() {
        RewardCatalog c=new RewardCatalog();c.setId(UUID.randomUUID());c.setPointsCost(1000);c.setDiscountAmount(new BigDecimal("10000"));
        c.setMinSpend(new BigDecimal("100000"));c.setValidityDays(30);return c;
    }
    private RewardVoucher voucher(UUID userId) {
        RewardVoucher v=new RewardVoucher();v.setId(UUID.randomUUID());v.setUserId(userId);v.setCatalogId(UUID.randomUUID());v.setPointsCost(1000);
        v.setDiscountAmount(new BigDecimal("10000"));v.setMinSpend(new BigDecimal("100000"));v.setExpiresAt(now.plus(Duration.ofDays(30)));return v;
    }
}
