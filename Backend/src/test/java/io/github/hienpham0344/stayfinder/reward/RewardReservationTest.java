package io.github.hienpham0344.stayfinder.reward;
import io.github.hienpham0344.stayfinder.reward.entity.*;
import io.github.hienpham0344.stayfinder.reward.repository.*;
import io.github.hienpham0344.stayfinder.reward.service.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
class RewardReservationTest {
 private final UUID userId=UUID.randomUUID(),bookingId=UUID.randomUUID(),quoteId=UUID.randomUUID(),claimId=UUID.randomUUID();
 private final io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher events=mock(io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher.class);
 private final UserRepository users=mock(UserRepository.class);
 private final RewardWalletRepository wallets=mock(RewardWalletRepository.class);
 private final RewardClaimRepository claims=mock(RewardClaimRepository.class);
 private final RewardReservationRepository reservations=mock(RewardReservationRepository.class);
 private final RewardLedgerEntryRepository ledger=mock(RewardLedgerEntryRepository.class);
 private final RewardWallet wallet=new RewardWallet();
 private final Map<UUID,RewardReservation> saved=new HashMap<>();private final Map<String,RewardLedgerEntry> entries=new HashMap<>();
 private final AdjustableClock clock=new AdjustableClock();
 private RewardReservationService service;
 static class AdjustableClock extends Clock {
  Instant now=Instant.parse("2026-10-13T00:00:00Z");public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return now;}
 }
 @BeforeEach void setup(){
  var user=new User();user.setId(userId);user.setCredentialState("active");when(users.lockById(userId)).thenReturn(Optional.of(user));
  wallet.setUserId(userId);wallet.setAvailablePoints(1000);when(wallets.lockById(userId)).thenReturn(Optional.of(wallet));when(wallets.findById(userId)).thenReturn(Optional.of(wallet));
  when(reservations.findById(any())).thenAnswer(i->Optional.ofNullable(saved.get(i.getArgument(0))));
  when(reservations.findOwnerByBookingId(any())).thenAnswer(i->Optional.ofNullable(saved.get(i.getArgument(0))).map(RewardReservation::getUserId));
  when(reservations.lockById(any())).thenAnswer(i->Optional.ofNullable(saved.get(i.getArgument(0))));
  when(reservations.save(any())).thenAnswer(i->{RewardReservation r=i.getArgument(0);saved.put(r.getBookingId(),r);return r;});
  when(ledger.findByUserIdAndSourceKey(any(),any())).thenAnswer(i->Optional.ofNullable(entries.get(i.getArgument(1))));
  when(ledger.save(any())).thenAnswer(i->{RewardLedgerEntry e=i.getArgument(0);entries.put(e.getSourceKey(),e);return e;});
  service=new RewardReservationService(new RewardWalletLocks(users,wallets),wallets,claims,reservations,ledger,clock,events);
 }
 @Test void pointsReserveConsumeAndRefundOnceWithoutOverdrawing(){
  var preview=service.preview(userId,10000,null,200,clock.instant());
  service.reserve(userId,quoteId,bookingId,preview);service.reserve(userId,quoteId,bookingId,preview);
  assertEquals(800,wallet.getAvailablePoints());assertEquals(200,wallet.getReservedPoints());
  service.consume(bookingId);service.consume(bookingId);
  assertEquals(800,wallet.getAvailablePoints());assertEquals(0,wallet.getReservedPoints());
  assertThrows(BusinessException.class,()->service.release(bookingId));
  service.restoreAfterRefund(bookingId);service.restoreAfterRefund(bookingId);
  assertEquals(1000,wallet.getAvailablePoints());assertEquals(0,wallet.getReservedPoints());assertEquals("restored",saved.get(bookingId).getState());
 }
 @Test void unpaidReleaseRestoresHeldPointsOnlyOnce(){
  service.reserve(userId,quoteId,bookingId,service.preview(userId,10000,null,200,clock.instant()));
  service.release(bookingId);service.release(bookingId);assertEquals(1000,wallet.getAvailablePoints());assertEquals(0,wallet.getReservedPoints());
  assertThrows(BusinessException.class,()->service.consume(bookingId));assertEquals("released",saved.get(bookingId).getState());
 }
 @Test void voucherMustBeOwnedAndExpiredRefundCannotReviveIt(){
  var claim=new RewardClaim();claim.setId(claimId);claim.setUserId(userId);claim.setStatus("available");claim.setKind("discount_voucher");
  claim.setExpiresAt(clock.instant().plusSeconds(60));claim.setMinimumRoomSubtotalCents(10000L);claim.setDiscountPercent(5);claim.setDiscountCapCents(2500L);
  when(claims.findByIdAndUserId(claimId,userId)).thenReturn(Optional.of(claim));when(claims.lockById(claimId)).thenReturn(Optional.of(claim));
  var preview=service.preview(userId,10000,claimId,0,clock.instant());
  service.reserve(userId,quoteId,bookingId,preview);assertEquals("reserved",claim.getStatus());service.consume(bookingId);assertEquals("used",claim.getStatus());
  clock.now=clock.now.plusSeconds(60);service.restoreAfterRefund(bookingId);assertEquals("expired",claim.getStatus());assertEquals(1000,wallet.getAvailablePoints());
  assertThrows(BusinessException.class,()->service.preview(UUID.randomUUID(),10000,claimId,0,clock.instant()));
 }
 @Test void earnedPointsAreOncePerCompletedBookingAndLifetimeTierDoesNotDependOnSpending(){
  service.earnOnce(userId,bookingId,103299);service.earnOnce(userId,bookingId,103299);
  assertEquals(2032,wallet.getAvailablePoints());assertEquals(1032,wallet.getLifetimeEarnedPoints());assertEquals(1,entries.size());
  verify(events,times(1)).publish("reward_earned",userId,bookingId,clock.instant());
  assertThrows(BusinessException.class,()->service.earnOnce(userId,bookingId,104000));assertEquals(2032,wallet.getAvailablePoints());
 }
 @Test void insufficientReserveDoesNotCreateAnOrphanBenefit(){
  wallet.setAvailablePoints(100);
  assertThrows(BusinessException.class,()->service.reserve(userId,quoteId,bookingId,new RewardPolicy.DiscountPreview("points",200,200,null)));
  assertTrue(saved.isEmpty());assertTrue(entries.isEmpty());assertEquals(100,wallet.getAvailablePoints());
 }
}
