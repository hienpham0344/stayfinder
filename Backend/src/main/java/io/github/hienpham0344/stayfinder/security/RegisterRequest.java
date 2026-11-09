package io.github.hienpham0344.stayfinder.security;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(@NotBlank @Size(max = 100) String fullName,
                              @NotBlank @Email String email,
                              @NotBlank @Size(min = 8) String password) {
}
