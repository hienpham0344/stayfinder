package io.github.hienpham0344.stayfinder.reward;
import io.github.hienpham0344.stayfinder.reward.service.RewardPolicy;
import io.github.hienpham0344.stayfinder.reward.service.RewardPolicy.Voucher;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
class RewardServiceTest {
 private final Instant now=Instant.parse("2026-10-13T00:00:00Z");
 @Test void pointsConvertToUsdCentsAndOnlyWholeBlocksWithinTheRoomCapAreReserved(){
  var single=RewardPolicy.preview(10000,100,10000,null,now);
  assertEquals(100L,single.discountCents());assertEquals(100L,single.reservedPoints());
  var capped=RewardPolicy.preview(10000,5000,10000,null,now);
  assertEquals(2000L,capped.discountCents());assertEquals(2000L,capped.reservedPoints());
  assertEquals(100L,RewardPolicy.preview(999,1000,10000,null,now).discountCents());
 }
 @Test void invalidOrUnavailablePointSpendAndStackingAreRejected(){
  assertThrows(BusinessException.class,()->RewardPolicy.preview(10000,101,10000,null,now));
  var unavailable=assertThrows(BusinessException.class,()->RewardPolicy.preview(10000,1000,900,null,now));
  assertEquals(ErrorCode.INSUFFICIENT_POINTS,unavailable.getErrorCode());
  assertThrows(BusinessException.class,()->RewardPolicy.preview(10000,100,10000,voucher(now.plusSeconds(1)),now));
 }
 private Voucher voucher(Instant expires){return new Voucher(UUID.randomUUID(),"discount_voucher","available",expires,10000,5,2500);}
 @Test void voucherMinimumCapAndStrictExpiryAreApplied(){
  assertEquals(500L,RewardPolicy.preview(10000,0,0,voucher(now.plusSeconds(1)),now).discountCents());
  assertEquals(2500L,RewardPolicy.preview(100000,0,0,voucher(now.plusSeconds(1)),now).discountCents());
  assertThrows(BusinessException.class,()->RewardPolicy.preview(9999,0,0,voucher(now.plusSeconds(1)),now));
  assertEquals(ErrorCode.VOUCHER_EXPIRED,assertThrows(BusinessException.class,()->RewardPolicy.preview(10000,0,0,voucher(now),now)).getErrorCode());
 }
 @Test void tierDependsOnLifetimeEarningsAndEarningUsesNetCollectedWholeDollars(){
  assertEquals("Silver",RewardPolicy.tier(9999));assertEquals("Gold",RewardPolicy.tier(10000));assertEquals("VIP",RewardPolicy.tier(25000));
  assertEquals(1032L,RewardPolicy.earnedPoints(103299));assertEquals(0L,RewardPolicy.earnedPoints(99));
 }
}
