package io.github.hienpham0344.stayfinder.auth.repository;
import io.github.hienpham0344.stayfinder.auth.entity.AuthAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface AuthAuditRepository extends JpaRepository<AuthAuditEvent,UUID> {}
