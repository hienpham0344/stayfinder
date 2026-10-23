package io.github.hienpham0344.stayfinder.auth.dto;
import jakarta.validation.constraints.*;
public record RegisterRequest(@NotBlank @Size(max=120) String fullName, @NotBlank @Size(max=320) String email, @NotNull String password) {}
