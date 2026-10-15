package io.github.hienpham0344.stayfinder.reward.service;
import io.github.hienpham0344.stayfinder.common.exception.*;
import java.time.Instant;
import java.util.UUID;
public final class RewardPolicy {
 private RewardPolicy(){}
 public static final long MAX_POINTS=9_007_199_254_740_991L;
 public record DiscountPreview(String source,long discountCents,long reservedPoints,UUID voucherClaimId){}
 public record Voucher(UUID id,String kind,String status,Instant expiresAt,long minimumRoomSubtotalCents,int discountPercent,long discountCapCents){}
 public static DiscountPreview preview(long subtotal,long points,long available,Voucher voucher,Instant now){
  if(subtotal<0||subtotal>MAX_POINTS||points<0||points%100!=0||available<0||available>MAX_POINTS||now==null)fail(ErrorCode.VALIDATION_ERROR);
  if(voucher!=null&&points>0)fail(ErrorCode.REWARD_INELIGIBLE);
  if(voucher!=null){
   if(voucher.expiresAt()==null||!voucher.expiresAt().isAfter(now))fail(ErrorCode.VOUCHER_EXPIRED);
   if(!"discount_voucher".equals(voucher.kind())||!"available".equals(voucher.status())||voucher.id()==null||
      voucher.discountPercent()<1||voucher.discountPercent()>20||voucher.minimumRoomSubtotalCents()<0||voucher.discountCapCents()<0||
      subtotal<voucher.minimumRoomSubtotalCents())fail(ErrorCode.REWARD_INELIGIBLE);
   long discount=Math.min(Math.multiplyExact(subtotal,voucher.discountPercent())/100,voucher.discountCapCents());
   return new DiscountPreview("voucher",discount,0,voucher.id());
  }
  if(points==0)return new DiscountPreview("none",0,0,null);
  if(points>available)fail(ErrorCode.INSUFFICIENT_POINTS);
  long cap=(subtotal/5/100)*100;
  if(cap==0)fail(ErrorCode.REWARD_INELIGIBLE);
  long redeemed=Math.min(points,cap);
  return new DiscountPreview("points",redeemed,redeemed,null);
 }
 public static String tier(long lifetime){if(lifetime<0)fail(ErrorCode.DEPENDENCY_UNAVAILABLE);return lifetime>=25000?"VIP":lifetime>=10000?"Gold":"Silver";}
 public static Long nextTierAt(long lifetime){return lifetime>=25000?null:lifetime>=10000?25000L:10000L;}
 public static long earnedPoints(long netCents){if(netCents<0||netCents>MAX_POINTS)fail(ErrorCode.VALIDATION_ERROR);return netCents/100;}
 public static long addPoints(long current,long delta){
  try{long result=Math.addExact(current,delta);if(result<0||result>MAX_POINTS)fail(ErrorCode.INSUFFICIENT_POINTS);return result;}
  catch(ArithmeticException e){throw new BusinessException(ErrorCode.REWARD_INELIGIBLE);}
 }
 private static void fail(ErrorCode code){throw new BusinessException(code);}
}
