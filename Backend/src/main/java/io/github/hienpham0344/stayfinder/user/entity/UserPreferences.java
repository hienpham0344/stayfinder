package io.github.hienpham0344.stayfinder.user.entity;import jakarta.persistence.*;import lombok.*;import java.util.UUID;
@Entity @Table(name="user_preferences")@Getter @Setter @NoArgsConstructor public class UserPreferences{
 @Id @Column(name="user_id")private UUID userId;@Column(nullable=false)private String language="en-US";@Column(name="booking_notifications",nullable=false)private boolean bookingNotifications=true;
}
