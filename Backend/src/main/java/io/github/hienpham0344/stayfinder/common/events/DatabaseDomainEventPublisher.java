package io.github.hienpham0344.stayfinder.common.events;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.Set;
@Service
public class DatabaseDomainEventPublisher implements DomainEventPublisher {
 private static final Set<String> TYPES=Set.of("booking_created","booking_cancelled","booking_expired","booking_paid","booking_completed",
  "refund_requested","refund_confirmed","reward_claimed","reward_earned");
 private final OutboxEventRepository rows;
 public DatabaseDomainEventPublisher(OutboxEventRepository rows){this.rows=rows;}
 @Override @Transactional(propagation=Propagation.MANDATORY)
 public void publish(DomainEvent e){
  if(e==null||e.eventId()==null||e.userId()==null||e.sourceId()==null||e.occurredAt()==null||!TYPES.contains(e.type()))
   throw new IllegalArgumentException("Invalid domain event");
  String key=e.type()+":"+e.userId()+":"+e.sourceId();
  if(rows.findByEventKey(key).isPresent())return;
  var row=new OutboxEvent();row.setId(e.eventId());row.setEventKey(key);row.setType(e.type());row.setUserId(e.userId());
  row.setSourceId(e.sourceId());row.setOccurredAt(e.occurredAt());rows.save(row);
 }
}
