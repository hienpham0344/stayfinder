package io.github.hienpham0344.stayfinder.support.entity;import jakarta.persistence.*;import lombok.*;import java.time.Instant;import java.util.UUID;
@Entity @Table(name="support_reports")@Getter @Setter @NoArgsConstructor public class SupportReport{
 @Id private UUID id;@Column(name="user_id",nullable=false,updatable=false)private UUID userId;@Column(name="booking_id",updatable=false)private UUID bookingId;
 @Column(nullable=false,updatable=false)private String category;@Column(nullable=false,updatable=false)private String description;@Column(nullable=false,updatable=false)private String status="submitted";@Column(name="created_at",nullable=false,updatable=false)private Instant createdAt;
}
