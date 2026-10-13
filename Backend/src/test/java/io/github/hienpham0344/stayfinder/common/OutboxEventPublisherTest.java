package io.github.hienpham0344.stayfinder.common;
import io.github.hienpham0344.stayfinder.common.events.*;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class OutboxEventPublisherTest {
 @Test void repeatedSourceEventPreservesOneDurableIdentityAndOriginalOccurrence(){
  var repo=mock(OutboxEventRepository.class);Map<String,OutboxEvent> rows=new HashMap<>();
  when(repo.findByEventKey(any())).thenAnswer(i->Optional.ofNullable(rows.get(i.getArgument(0))));
  when(repo.save(any())).thenAnswer(i->{OutboxEvent e=i.getArgument(0);rows.put(e.getEventKey(),e);return e;});
  var publisher=new DatabaseDomainEventPublisher(repo);UUID owner=UUID.randomUUID(),booking=UUID.randomUUID();
  Instant at=Instant.parse("2026-10-13T12:00:00Z");UUID first=UUID.randomUUID();
  publisher.publish(new DomainEvent(first,"booking_created",owner,booking,at));
  publisher.publish(new DomainEvent(UUID.randomUUID(),"booking_created",owner,booking,at.plusSeconds(1)));
  assertEquals(1,rows.size());OutboxEvent saved=rows.values().iterator().next();
  assertEquals(first,saved.getId());assertEquals(at,saved.getOccurredAt());assertEquals(owner,saved.getUserId());assertEquals(booking,saved.getSourceId());
  assertNull(saved.getMaterializedAt());verify(repo,times(1)).save(any());
 }
 @Test void arbitraryClientTypeCannotBecomeANotification(){
  var repo=mock(OutboxEventRepository.class);var publisher=new DatabaseDomainEventPublisher(repo);
  assertThrows(IllegalArgumentException.class,()->publisher.publish(new DomainEvent(UUID.randomUUID(),"client_paid",UUID.randomUUID(),UUID.randomUUID(),Instant.now())));
  verifyNoInteractions(repo);
 }
}
