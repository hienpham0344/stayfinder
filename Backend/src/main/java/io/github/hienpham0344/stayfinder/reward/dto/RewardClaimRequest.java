package io.github.hienpham0344.stayfinder.reward.dto;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
public record RewardClaimRequest(@NotNull UUID offerId){}
