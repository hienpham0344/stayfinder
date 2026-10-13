package io.github.hienpham0344.stayfinder.notification.entity;import jakarta.persistence.*;import lombok.*;import java.time.Instant;import java.util.UUID;
@Entity @Table(name="notifications")@Getter @Setter @NoArgsConstructor public class Notification{
 @Id private UUID id;@Column(name="user_id",nullable=false)private UUID userId;@Column(name="source_event_id",nullable=false)private UUID sourceEventId;
 @Column(name="event_type",nullable=false)private String type;@Column(nullable=false)private String title;@Column(nullable=false)private String body;
 @Column(name="target_route",nullable=false)private String targetRoute;@Column(name="target_resource_id")private UUID targetResourceId;
 @Column(name="created_at",nullable=false)private Instant createdAt;@Column(name="read_at")private Instant readAt;
}
