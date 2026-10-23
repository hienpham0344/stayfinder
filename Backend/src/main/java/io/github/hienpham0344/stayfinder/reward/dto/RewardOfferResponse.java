package io.github.hienpham0344.stayfinder.reward.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import java.util.UUID;
public record RewardOfferResponse(UUID id,String code,String title,long pointsCost,String kind,boolean isDemo,
 boolean eligible,String ineligibleReason,String fulfilmentDescription,Terms terms) {
 public record Terms(Integer discountPercent,MoneyUsd discountCap,MoneyUsd minimumRoomSubtotal,MoneyUsd benefitValue,int validityDays){}
}
