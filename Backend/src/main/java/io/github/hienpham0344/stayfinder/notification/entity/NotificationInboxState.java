package io.github.hienpham0344.stayfinder.notification.entity;import jakarta.persistence.*;import lombok.*;import java.time.Instant;import java.util.UUID;
@Entity @Table(name="notification_inbox_state")@Getter @Setter @NoArgsConstructor public class NotificationInboxState{
 @Id @Column(name="user_id")private UUID userId;@Column(name="latest_snapshot",nullable=false)private Instant latestSnapshot;
}
