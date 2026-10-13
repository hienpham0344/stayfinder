package io.github.hienpham0344.stayfinder.common.audit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface AuditRepository extends JpaRepository<AuditRecord,UUID>{}
