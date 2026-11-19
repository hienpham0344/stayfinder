package io.github.hienpham0344.stayfinder.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 100) String fullName,
        @Pattern(regexp = "[+0-9 ()-]{0,30}") String phone,
        @Size(max = 2048) @Pattern(regexp = "https://[^\\s]+|^$") String avatarUrl) {
}
