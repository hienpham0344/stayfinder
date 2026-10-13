package io.github.hienpham0344.stayfinder.notification.service;
import io.github.hienpham0344.stayfinder.notification.entity.Notification;import io.github.hienpham0344.stayfinder.notification.repository.NotificationRepository;import io.github.hienpham0344.stayfinder.notification.dto.*;
import io.github.hienpham0344.stayfinder.common.events.*;import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyLockRepository;import io.github.hienpham0344.stayfinder.common.exception.*;import io.github.hienpham0344.stayfinder.common.response.PageResponse;import io.github.hienpham0344.stayfinder.user.service.UserPreferencesService;import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import org.springframework.data.domain.Pageable;import jakarta.persistence.EntityManager;import java.time.*;import java.util.*;
@Service public class NotificationService{
 private final NotificationRepository rows;private final OutboxEventRepository events;private final UserPreferencesService preferences;private final BookingRepository bookings;private final IdempotencyLockRepository locks;private final EntityManager em;private final Clock clock;private final io.github.hienpham0344.stayfinder.notification.repository.NotificationInboxStateRepository inboxStates;
 public NotificationService(NotificationRepository rows,OutboxEventRepository events,UserPreferencesService preferences,BookingRepository bookings,IdempotencyLockRepository locks,EntityManager em,Clock clock,io.github.hienpham0344.stayfinder.notification.repository.NotificationInboxStateRepository inboxStates){this.rows=rows;this.events=events;this.preferences=preferences;this.bookings=bookings;this.locks=locks;this.em=em;this.clock=clock;this.inboxStates=inboxStates;}
 private void inbox(UUID owner){locks.lock(owner,"notification:inbox","owner");}
 @Transactional public NotificationPage list(UUID owner,boolean unread,Pageable page){inbox(owner);var result=unread?rows.findByUserIdAndReadAtIsNull(owner,page):rows.findByUserId(owner,page);Instant snapshot=clock.instant().truncatedTo(java.time.temporal.ChronoUnit.MICROS);var max=rows.latestDelivery(owner).orElse(snapshot);if(max.isAfter(snapshot))snapshot=max;var previous=issuedSnapshot(owner);if(previous!=null&&previous.isAfter(snapshot))snapshot=previous;var cursor=inboxStates.findById(owner).orElseGet(()->{var s=new io.github.hienpham0344.stayfinder.notification.entity.NotificationInboxState();s.setUserId(owner);return s;});cursor.setLatestSnapshot(snapshot);inboxStates.saveAndFlush(cursor);return NotificationPage.from(PageResponse.from(result.map(this::view)),snapshot);}
 @Transactional(readOnly=true)public long unreadCount(UUID owner){return rows.countByUserIdAndReadAtIsNull(owner);}
 @Transactional public NotificationResponse markRead(UUID owner,UUID id){inbox(owner);var n=rows.lockById(id).orElseThrow(()->new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));em.refresh(n);if(!owner.equals(n.getUserId()))throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);if(n.getReadAt()==null)n.setReadAt(n.getCreatedAt()!=null&&n.getCreatedAt().isAfter(clock.instant())?n.getCreatedAt():clock.instant());return view(n);}
 @Transactional public NotificationReadAllResponse markAllRead(UUID owner,Instant snapshot){if(snapshot==null)throw new BusinessException(ErrorCode.VALIDATION_ERROR);inbox(owner);Instant issued=issuedSnapshot(owner);if(issued==null||snapshot.isAfter(issued))throw new BusinessException(ErrorCode.VALIDATION_ERROR);int updated=rows.markAllRead(owner,snapshot,snapshot.isAfter(clock.instant())?snapshot:clock.instant());return new NotificationReadAllResponse(updated,rows.countByUserIdAndReadAtIsNull(owner));}
 @Transactional public int materializeBatch(){
  var batch=events.claimPendingBatch(100);batch.stream().map(OutboxEvent::getUserId).distinct().sorted().forEach(this::inbox);int delivered=0;
  for(var e:batch){
   if(e.getMaterializedAt()!=null)continue;
   if(rows.existsBySourceEventIdAndUserId(e.getId(),e.getUserId())){finish(e,"delivered");continue;}
   boolean reward=e.getType().startsWith("reward_");String[] message=message(e.getType());
   if(message==null){finish(e,"unsupported");continue;}
   if(!reward&&!preferences.get(e.getUserId()).bookingNotifications()){finish(e,"suppressed");continue;}
   if(!reward&&bookings.findByIdAndUserId(e.getSourceId(),e.getUserId()).isEmpty()){finish(e,"invalid_source");continue;}
   var n=new Notification();n.setId(UUID.randomUUID());n.setUserId(e.getUserId());n.setSourceEventId(e.getId());n.setType(e.getType());n.setTitle(message[0]);n.setBody(message[1]);n.setTargetRoute(reward?"rewards":"booking");n.setTargetResourceId(reward?null:e.getSourceId());
   // Delivery time is assigned after the inbox lock, rather than the old event time.
   Instant delivery=clock.instant().truncatedTo(java.time.temporal.ChronoUnit.MICROS);Instant issued=issuedSnapshot(e.getUserId());if(issued!=null&&!delivery.isAfter(issued))delivery=issued.plus(1,java.time.temporal.ChronoUnit.MICROS);n.setCreatedAt(delivery);rows.save(n);finish(e,"delivered");delivered++;
  }return delivered;
 }
 private Instant issuedSnapshot(UUID owner){var cursor=inboxStates.findById(owner).orElse(null);if(cursor==null)return null;em.refresh(cursor);return cursor.getLatestSnapshot();}
 private void finish(OutboxEvent e,String status){e.setMaterializationStatus(status);e.setMaterializedAt(clock.instant());}
 private NotificationResponse view(Notification n){return new NotificationResponse(n.getId(),n.getType(),n.getTitle(),n.getBody(),n.getCreatedAt(),n.getReadAt(),new NotificationResponse.Target(n.getTargetRoute(),n.getTargetResourceId()));}
 private static String[] message(String type){return switch(type){
  case "booking_created"->new String[]{"Booking saved","Open your booking to view confirmation and payment status."};
  case "booking_paid"->new String[]{"Payment recorded","Open your booking for the recorded payment details."};
  case "booking_cancelled"->new String[]{"Booking cancelled","Open your booking to view cancellation and refund status."};
  case "booking_expired"->new String[]{"Room hold expired","The payment hold has expired. Open your booking before making another transfer."};
  case "booking_completed"->new String[]{"Stay completed","Your paid stay is complete. You can view its details and review eligibility."};
  case "refund_requested"->new String[]{"Refund requested","A refund has been requested and is awaiting confirmation."};
  case "refund_confirmed"->new String[]{"Demo refund confirmed","Your refund was confirmed by the demo operator. View the booking for details."};
  case "reward_claimed"->new String[]{"Demo reward saved","Open Rewards to view the saved entitlement and its terms."};
  case "reward_earned"->new String[]{"Points earned","Points were added after a paid stay completed. Open Rewards for the ledger."};
  default->null;
 };}
}
