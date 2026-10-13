package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.payment.entity.PaymentWebhookEvent;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentWebhookEventRepository;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyLockRepository;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;import java.util.*;import java.security.*;
@Service
public class SepayReceiptService {
 private static final UUID PROVIDER_MUTEX=UUID.fromString("54b93e3e-1764-4e9c-b8e3-64bccb72f090");
 private final PaymentProvider provider;private final PaymentWebhookEventRepository rows;private final IdempotencyLockRepository mutex;private final Clock clock;
 public SepayReceiptService(PaymentProvider provider,PaymentWebhookEventRepository rows,IdempotencyLockRepository mutex,Clock clock){
  this.provider=provider;this.rows=rows;this.mutex=mutex;this.clock=clock;
 }
 // Receipt-only locks. Never call wallet/booking/payment mutation while holding this mutex/row.
 @Transactional public ProviderAcknowledgement receive(byte[] raw,String signature,String timestamp){
  var t=provider.verifyAndParse(raw,signature,timestamp);String hash;
  try{hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw));}catch(NoSuchAlgorithmException e){throw new IllegalStateException("SHA-256 unavailable");}
  mutex.lock(PROVIDER_MUTEX,"sepay:receipt",t.eventId());
  var existing=rows.lockNativeEvent("sepay","test",t.eventId());
  if(existing.isPresent()){
   var e=existing.get();
   if(!hash.equals(e.getPayloadHash())){
    e.setConflictCount(e.getConflictCount()==Integer.MAX_VALUE?Integer.MAX_VALUE:e.getConflictCount()+1);
    e.setLastConflictHash(hash);e.setLastConflictAt(clock.instant());e.setProcessingStatus("reconciliation");e.setResolutionReason("payload_conflict");
    rows.saveAndFlush(e);
   }
   return new ProviderAcknowledgement(true);
  }
  var e=new PaymentWebhookEvent();e.setId(UUID.randomUUID());e.setProvider("sepay");e.setEnvironment("test");e.setEventId(t.eventId());e.setPayloadHash(hash);
  e.setGateway(t.gateway());e.setTransactionAt(t.transactionAt());e.setAccountNumber(t.accountNumber());e.setSubAccount(t.subAccount());e.setCode(t.code());e.setContent(t.content());
  e.setTransferType(t.transferType());e.setTransferAmount(t.transferAmount());e.setReferenceCode(t.referenceCode());e.setReceivedAt(clock.instant());e.setProcessingStatus("received");
  rows.saveAndFlush(e);
  // The Spring transaction interceptor must commit before the controller receives this acknowledgement.
  return new ProviderAcknowledgement(true);
 }
}
