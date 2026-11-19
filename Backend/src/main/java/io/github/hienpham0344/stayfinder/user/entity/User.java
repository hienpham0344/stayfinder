package io.github.hienpham0344.stayfinder.user.entity;

import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.enums.UserRoleConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    private UUID id;
    @Column(name = "full_name") private String fullName;
    private String email;
    @Column(name = "password_hash") private String passwordHash;
    private String phone;
    @Convert(converter = UserRoleConverter.class) private UserRole role;
    @Column(name = "avatar_url") private String avatarUrl;
    @Column(name = "loyalty_points") private Integer loyaltyPoints;
    @Column(name = "loyalty_tier") private Integer loyaltyTier;
    @Column(name = "created_at") private Instant createdAt;
    @Column(nullable = false) private boolean enabled = true;
    @Column(name = "auth_version", nullable = false) private long authVersion;
    @Version private long version;
}
