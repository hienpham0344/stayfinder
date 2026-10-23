package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.payment.entity.*;
import io.github.hienpham0344.stayfinder.payment.repository.*;
import io.github.hienpham0344.stayfinder.payment.service.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyLockRepository;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class SepayReceiptServiceTest {
 final PaymentProvider provider=mock(PaymentProvider.class);
 final PaymentWebhookEventRepository rows=mock(PaymentWebhookEventRepository.class);
 final IdempotencyLockRepository mutex=mock(IdempotencyLockRepository.class);
 final Clock clock=Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC);
 final SepayReceiptService service=new SepayReceiptService(provider,rows,mutex,clock);
 final byte[] raw="{\"synthetic\":true}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
 final SepayTransaction tx=new SepayTransaction("92704","MBBank",clock.instant(),"000123456789",null,"SF1234567890","SF1234567890","in",25800000,"SB-fixture");
 @BeforeEach void setup(){when(provider.verifyAndParse(any(),any(),any())).thenReturn(tx);when(rows.lockNativeEvent("sepay","test","92704")).thenReturn(Optional.empty());when(rows.saveAndFlush(any())).thenAnswer(i->i.getArgument(0));}
 @Test void authenticReceiptIsDurableBeforeNativeAcknowledgement(){
  assertTrue(service.receive(raw,"sig","ts").success());
  var order=inOrder(provider,mutex,rows);order.verify(provider).verifyAndParse(raw,"sig","ts");
  order.verify(mutex).lock(any(),eq("sepay:receipt"),eq("92704"));order.verify(rows).lockNativeEvent("sepay","test","92704");
  order.verify(rows).saveAndFlush(argThat(e->e.getEventId().equals("92704")&&e.getEnvironment().equals("test")&&e.getPayloadHash().matches("[a-f0-9]{64}")&&e.getProcessingStatus().equals("received")));
 }
 @Test void duplicateKeepsOriginalReceiptAndChangedPayloadFlagsConflict(){
  service.receive(raw,"sig","ts");var cap=org.mockito.ArgumentCaptor.forClass(PaymentWebhookEvent.class);verify(rows).saveAndFlush(cap.capture());var original=cap.getValue();
  when(rows.lockNativeEvent("sepay","test","92704")).thenReturn(Optional.of(original));clearInvocations(rows);
  assertTrue(service.receive(raw,"sig","ts").success());verify(rows,never()).saveAndFlush(any());
  byte[] changed="{\"synthetic\":false}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
  String firstHash=original.getPayloadHash();assertTrue(service.receive(changed,"sig","ts").success());
  assertEquals(firstHash,original.getPayloadHash());assertEquals(1,original.getConflictCount());assertEquals("payload_conflict",original.getResolutionReason());
  assertEquals(tx.transferAmount(),original.getTransferAmount());assertEquals("reconciliation",original.getProcessingStatus());verify(rows).saveAndFlush(original);
 }
 @Test void databaseFailureAndFailedAuthenticationCannotReturnSuccess(){
  when(rows.saveAndFlush(any())).thenThrow(new IllegalStateException("Synthetic receipt outage"));
  assertThrows(IllegalStateException.class,()->service.receive(raw,"sig","ts"));
  reset(rows);when(provider.verifyAndParse(any(),any(),any())).thenThrow(new BusinessException(ErrorCode.UNAUTHORIZED));
  assertThrows(BusinessException.class,()->service.receive(raw,"bad","ts"));verifyNoInteractions(rows);
 }
}
