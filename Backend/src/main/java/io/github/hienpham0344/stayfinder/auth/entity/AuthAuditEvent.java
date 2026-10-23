package io.github.hienpham0344.stayfinder.auth.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="auth_audit_events") @Getter @Setter @NoArgsConstructor
public class AuthAuditEvent {
    @Id private UUID id;
    @Column(name="user_id",nullable=false) private UUID userId;
    @Column(nullable=false,length=40) private String action;
    @Column(name="occurred_at",nullable=false) private Instant occurredAt;
}
