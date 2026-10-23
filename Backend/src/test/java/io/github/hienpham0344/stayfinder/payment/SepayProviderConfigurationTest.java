package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.payment.service.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;import java.math.BigDecimal;import java.time.*;import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
class SepayProviderConfigurationTest {
 final Clock clock=Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC);
 PaymentProvider provider(boolean mode,String secret,String account,String sub){
  return new SepayPaymentProvider(mode,"MBBank","MB",account,"Synthetic holder",sub,new SepayWebhookAuthenticator(secret,clock),
   new SepayNativePayloadParser(JsonMapper.builder().build()),new SettlementRateService(new BigDecimal("25000"),"fixture-v1"));
 }
 @Test void explicitTestModeAdequateSecretAndValidReceivingAccountAreRequired(){
  for(var p:java.util.List.of(provider(false,"fixture-only-sepay-hmac-secret-32bytes","000123456789",null),
   provider(true,"short","000123456789",null),provider(true,"fixture-only-sepay-hmac-secret-32bytes","",null))){
   assertFalse(p.enabled());assertEquals(ErrorCode.DEPENDENCY_UNAVAILABLE,assertThrows(BusinessException.class,()->p.createBankInstructions(UUID.randomUUID(),103200)).getErrorCode());
  }
 }
 @Test void virtualAccountIsDisplayedWhileParentAccountIsPreservedForMatching(){
  var p=provider(true,"fixture-only-sepay-hmac-secret-32bytes","000123456789","TESTVA123");assertTrue(p.enabled());
  var setup=p.createBankInstructions(UUID.randomUUID(),103200);
  assertEquals("000123456789",setup.receivingAccountNumber());assertEquals("TESTVA123",setup.subAccount());assertEquals("TESTVA123",setup.instructions().accountNumber());
  assertTrue(setup.instructions().qrImageUrl().contains("acc=TESTVA123"));assertEquals("test",setup.instructions().environment());
 }
}
