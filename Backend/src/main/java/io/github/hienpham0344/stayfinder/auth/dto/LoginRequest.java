package io.github.hienpham0344.stayfinder.auth.dto;
import jakarta.validation.constraints.*;
public record LoginRequest(@NotBlank @Size(max=320) String email, @NotNull String password) {}
