package io.github.hienpham0344.stayfinder.reward.service;
import io.github.hienpham0344.stayfinder.reward.entity.*;
import io.github.hienpham0344.stayfinder.reward.repository.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.*;
import java.util.*;
@Service
@Transactional(propagation=Propagation.MANDATORY)
public class RewardReservationService implements RewardReservationOperations {
 private final RewardWalletLocks locks;private final RewardWalletRepository wallets;private final RewardClaimRepository claims;
 private final RewardReservationRepository reservations;private final RewardLedgerEntryRepository ledger;private final Clock clock;private final io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher events;
 public RewardReservationService(RewardWalletLocks locks,RewardWalletRepository wallets,RewardClaimRepository claims,RewardReservationRepository reservations,
  RewardLedgerEntryRepository ledger,Clock clock,io.github.hienpham0344.stayfinder.common.events.DomainEventPublisher events){this.locks=locks;this.wallets=wallets;this.claims=claims;this.reservations=reservations;this.ledger=ledger;this.clock=clock;this.events=events;}
 @Override @Transactional(readOnly=true)
 public RewardPolicy.DiscountPreview preview(UUID userId,long subtotal,UUID claimId,long points,Instant now){
  var wallet=wallets.findById(userId).orElseGet(RewardWallet::new);RewardWalletLocks.validate(wallet);
  RewardPolicy.Voucher voucher=null;
  if(claimId!=null){
   var claim=claims.findByIdAndUserId(claimId,userId).orElseThrow(()->new BusinessException(ErrorCode.REWARD_INELIGIBLE));
   if(claim.getDiscountPercent()==null||claim.getMinimumRoomSubtotalCents()==null||claim.getDiscountCapCents()==null)
    throw new BusinessException(ErrorCode.REWARD_INELIGIBLE);
   voucher=new RewardPolicy.Voucher(claim.getId(),claim.getKind(),claim.getStatus(),claim.getExpiresAt(),claim.getMinimumRoomSubtotalCents(),claim.getDiscountPercent(),claim.getDiscountCapCents());
  }
  return RewardPolicy.preview(subtotal,points,wallet.getAvailablePoints(),voucher,now);
 }
 @Override public void reserve(UUID userId,UUID quoteId,UUID bookingId,RewardPolicy.DiscountPreview preview){
  if(quoteId==null||bookingId==null||preview==null)invalid();
  validatePreview(preview);var wallet=locks.lock(userId);
  var old=reservations.findById(bookingId);
  if(old.isPresent()){
   var r=old.get();
   if(!userId.equals(r.getUserId())||!quoteId.equals(r.getQuoteId())||!preview.source().equals(r.getSource())||
    preview.discountCents()!=r.getDiscountCents()||preview.reservedPoints()!=r.getReservedPoints()||!Objects.equals(preview.voucherClaimId(),r.getVoucherClaimId()))invalid();
   return;
  }
  if(wallet.getAvailablePoints()<preview.reservedPoints())throw new BusinessException(ErrorCode.INSUFFICIENT_POINTS);
  RewardClaim claim=preview.voucherClaimId()==null?null:ownedClaim(preview.voucherClaimId(),userId);
  if(claim!=null){
   if(!"discount_voucher".equals(claim.getKind())||!"available".equals(claim.getStatus()))throw new BusinessException(ErrorCode.REWARD_INELIGIBLE);
   if(!claim.getExpiresAt().isAfter(clock.instant()))throw new BusinessException(ErrorCode.VOUCHER_EXPIRED);
  }
  long available=RewardPolicy.addPoints(wallet.getAvailablePoints(),-preview.reservedPoints());
  long reserved=RewardPolicy.addPoints(wallet.getReservedPoints(),preview.reservedPoints());
  var r=new RewardReservation();r.setBookingId(bookingId);r.setUserId(userId);r.setQuoteId(quoteId);r.setSource(preview.source());
  r.setVoucherClaimId(preview.voucherClaimId());r.setDiscountCents(preview.discountCents());r.setReservedPoints(preview.reservedPoints());r.setState("reserved");r.setCreatedAt(clock.instant());
  reservations.save(r);wallet.setAvailablePoints(available);wallet.setReservedPoints(reserved);
  if(claim!=null)claim.setStatus("reserved");
  if(preview.reservedPoints()>0)append(wallet,"reserved",-preview.reservedPoints(),bookingId,"reserve:"+bookingId,"Points held for booking",null);
 }
 @Override public void consume(UUID bookingId){transition(bookingId,"consumed");}
 @Override public void release(UUID bookingId){transition(bookingId,"released");}
 @Override public void restoreAfterRefund(UUID bookingId){transition(bookingId,"restored");}
 private void transition(UUID bookingId,String target){
  // The caller must acquire this same owner wallet before locking source room,
  // booking or payment. This reentrant lock never justifies the opposite order.
  UUID owner=reservations.findOwnerByBookingId(bookingId).orElse(null);if(owner==null)return;
  var wallet=locks.lock(owner);
  var r=reservations.lockById(bookingId).orElseThrow(()->new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE));
  if(!owner.equals(r.getUserId()))invalid();
  if(target.equals(r.getState()))return;
  boolean refund="restored".equals(target);
  if(!(refund?"consumed":"reserved").equals(r.getState()))invalid();
  long held=r.getReservedPoints();
  if(!refund&&wallet.getReservedPoints()<held)throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
  RewardClaim claim=r.getVoucherClaimId()==null?null:ownedClaim(r.getVoucherClaimId(),owner);
  if(claim!=null&&!(refund?"used":"reserved").equals(claim.getStatus()))invalid();
  long available=wallet.getAvailablePoints();
  if(!"consumed".equals(target))available=RewardPolicy.addPoints(available,held);
  wallet.setAvailablePoints(available);
  if(!refund)wallet.setReservedPoints(wallet.getReservedPoints()-held);
  if(claim!=null)claim.setStatus("consumed".equals(target)?"used":claim.getExpiresAt().isAfter(clock.instant())?"available":"expired");
  r.setState(target);r.setProcessedAt(clock.instant());
  if(held>0)append(wallet,target,"consumed".equals(target)?0:held,bookingId,target+":"+bookingId,
   "consumed".equals(target)?"Booking points spent":"released".equals(target)?"Booking points released":"Booking points restored after refund",null);
 }
 @Override public void earnOnce(UUID userId,UUID bookingId,long netCents){
  // Only the paid/local-checkout completion service calls this operation.
  if(bookingId==null)invalid();long points=RewardPolicy.earnedPoints(netCents);var wallet=locks.lock(userId);
  var existing=ledger.findByUserIdAndSourceKey(userId,"earn:"+bookingId);
  if(existing.isPresent()){
   if(!Objects.equals(existing.get().getBasisUsdCents(),netCents))throw new BusinessException(ErrorCode.IDEMPOTENCY_CONFLICT);
   return;
  }
  long available=RewardPolicy.addPoints(wallet.getAvailablePoints(),points),lifetime=RewardPolicy.addPoints(wallet.getLifetimeEarnedPoints(),points);
  wallet.setAvailablePoints(available);wallet.setLifetimeEarnedPoints(lifetime);
  append(wallet,"earned",points,bookingId,"earn:"+bookingId,"Points earned for completed stay",netCents);
  events.publish("reward_earned",userId,bookingId,clock.instant());
 }
 private RewardClaim ownedClaim(UUID id,UUID owner){
  return claims.lockById(id).filter(c->owner.equals(c.getUserId())).orElseThrow(()->new BusinessException(ErrorCode.REWARD_INELIGIBLE));
 }
 private void append(RewardWallet wallet,String kind,long delta,UUID bookingId,String sourceKey,String title,Long basis){
  var entry=new RewardLedgerEntry();entry.setId(UUID.randomUUID());entry.setUserId(wallet.getUserId());entry.setKind(kind);entry.setDeltaPoints(delta);
  entry.setSourceType("booking");entry.setSourceId(bookingId);entry.setSourceKey(sourceKey);entry.setBalanceAfter(wallet.getAvailablePoints());entry.setCreatedAt(clock.instant());
  entry.setTitle(title);entry.setBasisUsdCents(basis);ledger.save(entry);
 }
 private static void validatePreview(RewardPolicy.DiscountPreview p){
  if(p.source()==null||p.discountCents()<0||p.discountCents()>RewardPolicy.MAX_POINTS||p.reservedPoints()<0||p.reservedPoints()>RewardPolicy.MAX_POINTS)invalid();
  switch(p.source()){
   case "none"->{if(p.discountCents()!=0||p.reservedPoints()!=0||p.voucherClaimId()!=null)invalid();}
   case "points"->{if(p.reservedPoints()==0||p.reservedPoints()%100!=0||p.discountCents()!=p.reservedPoints()||p.voucherClaimId()!=null)invalid();}
   case "voucher"->{if(p.voucherClaimId()==null||p.reservedPoints()!=0)invalid();}
   default->invalid();
  }
 }
 private static void invalid(){throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);}
}
