package io.github.hienpham0344.stayfinder.common.events;
import java.time.Instant;
import java.util.UUID;
public record DomainEvent(UUID eventId,String type,UUID userId,UUID sourceId,Instant occurredAt){}
