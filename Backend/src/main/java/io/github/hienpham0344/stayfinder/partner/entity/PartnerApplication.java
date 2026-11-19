package io.github.hienpham0344.stayfinder.partner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "partner_applications", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
@Getter @Setter @NoArgsConstructor
public class PartnerApplication {
    public enum Status { PENDING, APPROVED, REJECTED }

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "business_name", nullable = false, length = 200) private String businessName;
    @Column(nullable = false, length = 2000) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status;
    @Column(length = 1000) private String reason;
    @Column(name = "reviewed_by") private UUID reviewedBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "reviewed_at") private Instant reviewedAt;
    @Version private long version;
}
