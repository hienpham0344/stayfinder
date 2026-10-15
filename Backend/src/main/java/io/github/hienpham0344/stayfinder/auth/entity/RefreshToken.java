package io.github.hienpham0344.stayfinder.auth.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="refresh_tokens") @Getter @Setter @NoArgsConstructor
public class RefreshToken {
    @Id private UUID id;
    @Column(name="session_id",nullable=false) private UUID sessionId;
    @Column(name="token_hash",nullable=false,unique=true,length=64) private String tokenHash;
    @Column(name="issued_at",nullable=false) private Instant issuedAt;
    @Column(name="expires_at",nullable=false) private Instant expiresAt;
    @Column(name="consumed_at") private Instant consumedAt;
    @Column(name="replaced_by") private UUID replacedBy;
}
