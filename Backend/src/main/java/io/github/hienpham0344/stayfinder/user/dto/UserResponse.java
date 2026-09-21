package io.github.hienpham0344.stayfinder.user.dto;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;

import java.util.UUID;

public record UserResponse(UUID id, String fullName, String email, String phone,
                           UserRole role, String avatarUrl, Integer loyaltyPoints, Integer loyaltyTier) {
}
