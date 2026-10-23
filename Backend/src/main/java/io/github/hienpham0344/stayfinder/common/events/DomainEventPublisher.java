package io.github.hienpham0344.stayfinder.common.events;
import java.time.Instant;
import java.util.UUID;
public interface DomainEventPublisher {
 void publish(DomainEvent event);
 default void publish(String type,UUID userId,UUID sourceId,Instant occurredAt){
  publish(new DomainEvent(UUID.randomUUID(),type,userId,sourceId,occurredAt));
 }
}
