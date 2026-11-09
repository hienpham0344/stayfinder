package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.user.dto.UserResponse;

public record AuthResponse(String token, UserResponse user) {
}
