package io.github.hienpham0344.stayfinder.auth.dto;
import jakarta.validation.constraints.*;
public record PasswordChangeRequest(@NotNull String currentPassword, @NotNull String newPassword) {}
