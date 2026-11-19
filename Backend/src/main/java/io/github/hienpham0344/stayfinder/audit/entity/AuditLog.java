package io.github.hienpham0344.stayfinder.audit.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "actor_id", nullable = false) private UUID actorId;
    @Column(nullable = false, length = 80) private String action;
    @Column(name = "target_type", nullable = false, length = 80) private String targetType;
    @Column(name = "target_id", nullable = false) private UUID targetId;
    @Column(length = 1000) private String reason;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
}
