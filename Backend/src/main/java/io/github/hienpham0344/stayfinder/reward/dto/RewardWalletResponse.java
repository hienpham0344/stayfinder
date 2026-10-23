package io.github.hienpham0344.stayfinder.reward.dto;
public record RewardWalletResponse(long availablePoints,long reservedPoints,long lifetimeEarnedPoints,String tier,Long nextTierAt,int pointsPerUsd,int maxRoomDiscountPercent){}
