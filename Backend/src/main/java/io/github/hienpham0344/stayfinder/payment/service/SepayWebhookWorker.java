package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentWebhookEventRepository;
import org.springframework.stereotype.Component;import org.springframework.scheduling.annotation.Scheduled;import org.springframework.data.domain.PageRequest;
import org.slf4j.*;
@Component
public class SepayWebhookWorker {
 private static final Logger log=LoggerFactory.getLogger(SepayWebhookWorker.class);
 private final PaymentWebhookEventRepository events;private final SepayReconciliationService reconciliation;
 public SepayWebhookWorker(PaymentWebhookEventRepository events,SepayReconciliationService reconciliation){this.events=events;this.reconciliation=reconciliation;}
 @Scheduled(fixedDelayString="${stayfinder.workers.sepay-delay-ms:1000}")
 public void runOnce(){
  for(var id:events.findReceivedIds(PageRequest.of(0,100))){
   try{reconciliation.process(id);}catch(RuntimeException e){log.warn("SePay receipt processing deferred ({})",e.getClass().getSimpleName());}
  }
 }
}
