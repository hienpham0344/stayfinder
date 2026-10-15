package io.github.hienpham0344.stayfinder.common.audit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.Clock;
import java.util.UUID;
@Service
public class AuditService {
 private final AuditRepository rows;private final Clock clock;
 public AuditService(AuditRepository rows,Clock clock){this.rows=rows;this.clock=clock;}
 @Transactional(propagation=Propagation.MANDATORY)
 public void record(UUID actorId,String action,UUID sourceId){
  if(actorId==null||sourceId==null||action==null||!action.matches("[a-z_]{1,64}"))throw new IllegalArgumentException("Invalid audit event");
  var row=new AuditRecord();row.setId(UUID.randomUUID());row.setActorId(actorId);row.setSourceId(sourceId);row.setAction(action);row.setOccurredAt(clock.instant());rows.save(row);
 }
}
