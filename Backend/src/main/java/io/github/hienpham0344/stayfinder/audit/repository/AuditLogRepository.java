package io.github.hienpham0344.stayfinder.audit.repository;

import io.github.hienpham0344.stayfinder.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
}
