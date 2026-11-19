package io.github.hienpham0344.stayfinder.audit.service;

import io.github.hienpham0344.stayfinder.audit.entity.AuditLog;
import io.github.hienpham0344.stayfinder.audit.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

@Service
public class AuditService {
    private final AuditLogRepository repository;
    private final Clock clock;

    public AuditService(AuditLogRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public void record(UUID actorId, String action, String targetType, UUID targetId, String reason) {
        AuditLog log = new AuditLog();
        log.setActorId(actorId);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setReason(reason);
        log.setCreatedAt(clock.instant());
        repository.save(log);
    }
}
