package io.github.hienpham0344.stayfinder.common.audit;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="audit_records") @Getter @Setter @NoArgsConstructor
public class AuditRecord {
 @Id private UUID id;
 @Column(name="actor_id",nullable=false) private UUID actorId;
 @Column(name="source_id",nullable=false) private UUID sourceId;
 @Column(nullable=false,length=64) private String action;
 @Column(name="occurred_at",nullable=false) private Instant occurredAt;
}
