package io.github.hienpham0344.stayfinder.notification.service;import org.springframework.stereotype.Component;import org.springframework.scheduling.annotation.Scheduled;import org.springframework.beans.factory.annotation.Value;
@Component public class NotificationOutboxWorker{
 private final NotificationService service;private final boolean enabled;public NotificationOutboxWorker(NotificationService service,@Value("${stayfinder.workers.enabled:true}")boolean enabled){this.service=service;this.enabled=enabled;}
 @Scheduled(fixedDelay=2000)public void run(){if(enabled)try{service.materializeBatch();}catch(RuntimeException e){org.slf4j.LoggerFactory.getLogger(getClass()).warn("Notification delivery failed: {}",e.getClass().getSimpleName());}}
}
