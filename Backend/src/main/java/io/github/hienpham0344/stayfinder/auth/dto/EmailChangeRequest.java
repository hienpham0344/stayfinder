package io.github.hienpham0344.stayfinder.auth.dto;
import jakarta.validation.constraints.*;
public record EmailChangeRequest(@NotNull String currentPassword, @NotBlank @Size(max=320) String newEmail) {}
