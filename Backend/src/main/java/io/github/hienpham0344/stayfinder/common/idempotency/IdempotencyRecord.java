package io.github.hienpham0344.stayfinder.common.idempotency;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="idempotency_records",uniqueConstraints=@UniqueConstraint(name="uq_idempotency_owner_operation_key",columnNames={"user_id","operation","request_key"}))
@Getter @Setter @NoArgsConstructor
public class IdempotencyRecord {
 @Id private UUID id;
 @Column(name="user_id",nullable=false) private UUID userId;
 @Column(nullable=false,length=64) private String operation;
 @Column(name="request_key",nullable=false,length=128) private String requestKey;
 @Column(name="request_hash",nullable=false,length=64) private String requestHash;
 @Column(name="result_type",nullable=false,length=512) private String resultType;
 @Column(name="result_json",nullable=false,columnDefinition="text") private String resultJson;
 @Column(name="created_at",nullable=false) private Instant createdAt;
}
