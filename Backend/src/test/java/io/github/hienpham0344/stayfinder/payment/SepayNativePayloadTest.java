package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.payment.service.SepayNativePayloadParser;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;
class SepayNativePayloadTest {
 final SepayNativePayloadParser parser=new SepayNativePayloadParser(JsonMapper.builder().build());
 final String nativeJson="{\"id\":92704,\"gateway\":\"MBBank\",\"transactionDate\":\"2026-10-13 19:00:00\",\"accountNumber\":\"0123456789\",\"subAccount\":\"\",\"code\":null,\"content\":\"SF1234567890 chuyển tiền\",\"transferType\":\"in\",\"description\":\"\",\"transferAmount\":25800000,\"accumulated\":0,\"referenceCode\":\"SBEXAMPLE\"}";
 byte[] bytes(String s){return s.getBytes(StandardCharsets.UTF_8);}
 @Test void readsActualNativeFieldsAndVietnamTransactionTimeWithoutClientBookingOrStatus(){
  var p=parser.parse(bytes(nativeJson));
  assertEquals("92704",p.eventId());assertEquals(25800000,p.transferAmount());assertEquals("in",p.transferType());
  assertEquals(Instant.parse("2026-10-13T12:00:00Z"),p.transactionAt());assertNull(p.code());assertEquals("",p.subAccount());
  assertTrue(p.content().contains("chuyển tiền"));
 }
 @Test void rejectsFractionalCoercedOrOverflowedFinancialFields(){
  for(String json:new String[]{nativeJson.replace("25800000","25800000.5"),nativeJson.replace("25800000","\"25800000\""),
    nativeJson.replace("25800000","9223372036854775808"),nativeJson.replace("92704","92704.5"),nativeJson.replace("92704","\"92704\"")})
   assertThrows(BusinessException.class,()->parser.parse(bytes(json)));
 }
 @Test void rejectsImpossibleDateDuplicateAmountTrailingJsonAndLegacyCustomPayload(){
  assertThrows(BusinessException.class,()->parser.parse(bytes(nativeJson.replace("2026-10-13","2026-02-30"))));
  assertThrows(BusinessException.class,()->parser.parse(bytes(nativeJson.replace("\"transferAmount\":25800000","\"transferAmount\":1,\"transferAmount\":25800000"))));
  assertThrows(BusinessException.class,()->parser.parse(bytes(nativeJson+" {}")));
  assertThrows(BusinessException.class,()->parser.parse(bytes("{\"bookingId\":\"forged\",\"status\":\"success\",\"amount\":1032}")));
 }
 @Test void permitsFutureProviderMetadataButNeverTreatsItAsPaymentAuthority(){
  var p=parser.parse(bytes(nativeJson.replace("\"id\":92704","\"id\":92704,\"bookingId\":\"forged\",\"status\":\"success\",\"test_mode\":true")));
  assertEquals(25800000,p.transferAmount());assertEquals("92704",p.eventId());assertNull(p.code());
 }
}
