package io.github.hienpham0344.stayfinder.reward.service;
import io.github.hienpham0344.stayfinder.reward.dto.*;
import io.github.hienpham0344.stayfinder.reward.entity.*;
import io.github.hienpham0344.stayfinder.reward.repository.*;
import io.github.hienpham0344.stayfinder.common.audit.AuditService;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;
import java.time.*;
import java.util.*;
@Service
@Transactional(readOnly=true)
public class RewardServiceImpl implements RewardService {
 private final RewardWalletLocks locks;private final RewardWalletRepository wallets;private final RewardOfferRepository offers;
 private final RewardClaimRepository claims;private final RewardLedgerEntryRepository ledger;
 private final IdempotencyService idempotency;private final AuditService audit;private final Clock clock;
 public RewardServiceImpl(RewardWalletLocks locks,RewardWalletRepository wallets,RewardOfferRepository offers,RewardClaimRepository claims,
   RewardLedgerEntryRepository ledger,IdempotencyService idempotency,AuditService audit,Clock clock){
  this.locks=locks;this.wallets=wallets;this.offers=offers;this.claims=claims;this.ledger=ledger;this.idempotency=idempotency;this.audit=audit;this.clock=clock;
 }
 @Override public RewardWalletResponse wallet(UUID userId){
  var wallet=wallets.findById(userId).orElseGet(RewardWallet::new);RewardWalletLocks.validate(wallet);
  return new RewardWalletResponse(wallet.getAvailablePoints(),wallet.getReservedPoints(),wallet.getLifetimeEarnedPoints(),
   RewardPolicy.tier(wallet.getLifetimeEarnedPoints()),RewardPolicy.nextTierAt(wallet.getLifetimeEarnedPoints()),100,20);
 }
 @Override public List<RewardOfferResponse> catalog(UUID userId){
  long available=wallet(userId).availablePoints();Instant now=clock.instant();
  return offers.findByActiveTrueOrderByPointsCostAscIdAsc().stream().filter(RewardServiceImpl::configured).map(o->{
   boolean eligible=active(o,now)&&available>=o.getPointsCost();
   String reason=!active(o,now)?"Offer is unavailable":available<o.getPointsCost()?"Insufficient available points":null;
   return offerResponse(o,eligible,reason);
  }).toList();
 }
 @Override public PageResponse<RewardHistoryResponse> history(UUID userId,Pageable pageable){
  return PageResponse.from(ledger.findByUserIdOrderByCreatedAtDescIdDesc(userId,pageable).map(e->
   new RewardHistoryResponse(e.getId(),e.getKind(),e.getDeltaPoints(),e.getSourceType(),e.getSourceId(),e.getBalanceAfter(),e.getCreatedAt(),e.getTitle())));
 }
 @Override public PageResponse<RewardClaimResponse> claims(UUID userId,Pageable pageable){
  return PageResponse.from(claims.findByUserIdOrderByCreatedAtDescIdDesc(userId,pageable).map(this::claimResponse));
 }
 @Override @Transactional public RewardClaimResponse claim(UUID userId,UUID offerId,String key){
  if(offerId==null)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  return idempotency.execute(userId,"rewards.claim",key,idempotency.fingerprint(new RewardClaimRequest(offerId)),RewardClaimResponse.class,()->{
   var wallet=locks.lock(userId);Instant now=clock.instant();
   var offer=offers.lockById(offerId).filter(o->configured(o)&&active(o,now)).orElseThrow(()->new BusinessException(ErrorCode.REWARD_INELIGIBLE));
   if(wallet.getAvailablePoints()<offer.getPointsCost())throw new BusinessException(ErrorCode.INSUFFICIENT_POINTS);
   var claim=new RewardClaim();claim.setId(UUID.randomUUID());claim.setUserId(userId);claim.setOfferId(offer.getId());claim.setStatus("available");
   claim.setCreatedAt(now);claim.setExpiresAt(now.plus(Duration.ofDays(offer.getValidityDays())));
   claim.setOfferCode(offer.getCode());claim.setOfferTitle(offer.getTitle());claim.setKind(offer.getKind());claim.setPointsCost(offer.getPointsCost());
   claim.setValidityDays(offer.getValidityDays());claim.setDiscountPercent(offer.getDiscountPercent());claim.setDiscountCapCents(offer.getDiscountCapCents());
   claim.setMinimumRoomSubtotalCents(offer.getMinimumRoomSubtotalCents());claim.setBenefitValueCents(offer.getBenefitValueCents());claim.setFulfilmentDescription(offer.getFulfilmentDescription());
   wallet.setAvailablePoints(RewardPolicy.addPoints(wallet.getAvailablePoints(),-offer.getPointsCost()));
   claims.save(claim);
   var entry=new RewardLedgerEntry();entry.setId(UUID.randomUUID());entry.setUserId(userId);entry.setKind("claim");entry.setDeltaPoints(-offer.getPointsCost());
   entry.setSourceType("reward_claim");entry.setSourceId(claim.getId());entry.setSourceKey("claim:"+claim.getId());entry.setBalanceAfter(wallet.getAvailablePoints());entry.setCreatedAt(now);entry.setTitle(offer.getTitle());
   ledger.save(entry);audit.record(userId,"reward_claimed",claim.getId());
   return claimResponse(claim);
  });
 }
 private static boolean active(RewardOffer o,Instant now){
  return o.isActive()&&(o.getValidFrom()==null||!o.getValidFrom().isAfter(now))&&(o.getValidUntil()==null||o.getValidUntil().isAfter(now));
 }
 private static boolean configured(RewardOffer o){
  if(o.getId()==null||o.getCode()==null||o.getCode().isBlank()||o.getTitle()==null||o.getTitle().isBlank()||
     o.getFulfilmentDescription()==null||o.getFulfilmentDescription().isBlank()||o.getValidityDays()!=30||o.getKind()==null)return false;
  return switch(o.getKind()){
   case "breakfast"->o.getPointsCost()==5000;
   case "room_upgrade"->o.getPointsCost()==12000;
   case "spa_credit"->o.getPointsCost()==8500&&Objects.equals(o.getBenefitValueCents(),5000L);
   case "discount_voucher"->o.getPointsCost()==1000&&Objects.equals(o.getDiscountPercent(),5)&&Objects.equals(o.getDiscountCapCents(),2500L)&&Objects.equals(o.getMinimumRoomSubtotalCents(),10000L);
   default->false;
  };
 }
 private static MoneyUsd money(Long cents){return cents==null?null:MoneyUsd.cents(cents);}
 private static RewardOfferResponse offerResponse(RewardOffer o,boolean eligible,String reason){
  return new RewardOfferResponse(o.getId(),o.getCode(),o.getTitle(),o.getPointsCost(),o.getKind(),true,eligible,reason,o.getFulfilmentDescription(),
   new RewardOfferResponse.Terms(o.getDiscountPercent(),money(o.getDiscountCapCents()),money(o.getMinimumRoomSubtotalCents()),money(o.getBenefitValueCents()),o.getValidityDays()));
 }
 private RewardClaimResponse claimResponse(RewardClaim c){
  String status="available".equals(c.getStatus())&&!c.getExpiresAt().isAfter(clock.instant())?"expired":c.getStatus();
  boolean usable="available".equals(status);
  var offer=new RewardOfferResponse(c.getOfferId(),c.getOfferCode(),c.getOfferTitle(),c.getPointsCost(),c.getKind(),true,usable,usable?null:"Entitlement is "+status,c.getFulfilmentDescription(),
   new RewardOfferResponse.Terms(c.getDiscountPercent(),money(c.getDiscountCapCents()),money(c.getMinimumRoomSubtotalCents()),money(c.getBenefitValueCents()),c.getValidityDays()));
  return new RewardClaimResponse(c.getId(),offer,status,c.getExpiresAt());
 }
}
