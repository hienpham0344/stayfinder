package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(@NotBlank @Size(max = 100) String fullName,
                              @NotBlank @Email @Size(max = 254) String email,
                              @NotBlank @Size(min = 8, max = 72) String password,
                              UserRole role) {
}
