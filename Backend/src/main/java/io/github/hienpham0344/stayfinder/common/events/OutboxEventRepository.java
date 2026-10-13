package io.github.hienpham0344.stayfinder.common.events;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface OutboxEventRepository extends JpaRepository<OutboxEvent,UUID> {Optional<OutboxEvent> findByEventKey(String key);}
