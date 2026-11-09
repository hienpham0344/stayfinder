package io.github.hienpham0344.stayfinder.admin.dto;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Administrative contracts intentionally omit credentials and session tokens. */
public final class AdminDtos {
    private AdminDtos() {}
    public record Page<T>(List<T> items, long total, int page, int size) {}
    public record Account(UUID id, String email, String fullName, String role, String credentialState) {}
    public record AccessChange(@NotNull UserRole role, @NotNull Boolean enabled, @NotBlank @Size(max=500) String reason) {}
    public record Report(UUID id, UUID userId, UUID bookingId, String category, String description, String status, Instant createdAt) {}
    public enum ReportStatus { IN_REVIEW, RESOLVED, DISMISSED }
    public record ReportChange(@NotNull ReportStatus status, @NotBlank @Size(max=500) String reason) {}
    public record Content(UUID id, String text, String status) {}
    public record AccommodationDetail(UUID id, UUID partnerId, String name, String address, String description, String status, boolean moderationBlocked) {}
    public enum AccommodationDecision { APPROVE, HIDE }
    public record AccommodationChange(@NotNull AccommodationDecision decision, @NotBlank @Size(max=500) String reason) {}
    public record ReviewChange(@NotNull Boolean hidden, @NotBlank @Size(max=500) String reason) {}
    public enum SettingKey { SUPPORT_EMAIL, SUPPORT_RESPONSE_HOURS }
    public record Setting(String key, String value) {}
    public record SettingChange(@NotBlank @Size(max=200) String value, @NotBlank @Size(max=500) String reason) {}
}
