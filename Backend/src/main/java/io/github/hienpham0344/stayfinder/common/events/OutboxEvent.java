package io.github.hienpham0344.stayfinder.common.events;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Table(name="outbox_events") @Getter @Setter @NoArgsConstructor
public class OutboxEvent {
 @Id private UUID id;
 @Column(name="event_key") private String eventKey;
 @Column(name="event_type") private String type;
 @Column(name="user_id") private UUID userId;
 @Column(name="source_id") private UUID sourceId;
 @Column(name="occurred_at") private Instant occurredAt;
 @Column(name="materialized_at") private Instant materializedAt;
 @Column(name="materialization_status") private String materializationStatus;
}
