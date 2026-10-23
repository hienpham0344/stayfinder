package io.github.hienpham0344.stayfinder.reward.dto;
import java.time.Instant;
import java.util.UUID;
public record RewardHistoryResponse(UUID id,String kind,long deltaPoints,String sourceType,UUID sourceId,long balanceAfter,Instant createdAt,String title){}
