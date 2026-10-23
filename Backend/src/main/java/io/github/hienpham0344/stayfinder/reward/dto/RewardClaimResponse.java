package io.github.hienpham0344.stayfinder.reward.dto;
import java.time.Instant;
import java.util.UUID;
public record RewardClaimResponse(UUID id,RewardOfferResponse offer,String status,Instant expiresAt){}
