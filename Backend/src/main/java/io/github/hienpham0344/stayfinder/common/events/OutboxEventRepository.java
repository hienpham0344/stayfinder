package io.github.hienpham0344.stayfinder.common.events;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface OutboxEventRepository extends JpaRepository<OutboxEvent,UUID> {
 @org.springframework.data.jpa.repository.Query(value="select * from outbox_events where materialized_at is null order by occurred_at,id limit :limit for update skip locked",nativeQuery=true)
 List<OutboxEvent> claimPendingBatch(@org.springframework.data.repository.query.Param("limit")int limit);Optional<OutboxEvent> findByEventKey(String key);}
