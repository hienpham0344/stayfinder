package io.github.hienpham0344.stayfinder.media.entity;
import jakarta.persistence.*;import lombok.*;import java.time.Instant;import java.util.UUID;
@Entity @Table(name="media_assets") @Getter @Setter @NoArgsConstructor public class MediaAsset{
 @Id private UUID id;@Column(name="user_id",nullable=false)private UUID userId;@Column(name="review_id")private UUID reviewId;
 @Column(name="mime_type",nullable=false)private String mimeType;@Column(name="size_bytes",nullable=false)private long sizeBytes;
 @Column(name="created_at",nullable=false)private Instant createdAt;@Column(name="unattached_since")private Instant unattachedSince;
}
