package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.payment.service.SepayWebhookAuthenticator;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;
class SepayWebhookAuthenticationTest {
 // Expected digest generated independently with Node crypto; fixture key contains no provider credential.
 final String key="fixture-only-sepay-hmac-secret-32bytes";
 final String timestamp="1791892800",signature="sha256=250eb6e64b659016555d918ef3ddb04ccdd3c443ef4e955fb2b34bd0d46a7bdd";
 final byte[] body="{ \"id\": 92704, \"content\": \"chuyển tiền SF1234567890\", \"transferAmount\": 25800000 }".getBytes(StandardCharsets.UTF_8);
 SepayWebhookAuthenticator auth(Instant now){return new SepayWebhookAuthenticator(key,Clock.fixed(now,ZoneOffset.UTC));}
 final Instant now=Instant.ofEpochSecond(1791892800L);
 @Test void verifiesNativeHeaderOverExactTimestampAndUtf8RawBytes(){
  assertTrue(auth(now).verify(body,signature,timestamp));
 }
 @Test void changedAmountOrWhitespaceAndWrongSecretCannotAuthenticate(){
  assertFalse(auth(now).verify(new String(body,StandardCharsets.UTF_8).replace("25800000","25800001").getBytes(StandardCharsets.UTF_8),signature,timestamp));
  assertFalse(auth(now).verify(new String(body,StandardCharsets.UTF_8).replace(": ",":").getBytes(StandardCharsets.UTF_8),signature,timestamp));
  assertFalse(new SepayWebhookAuthenticator("different-fixture-key-with-32chars",Clock.fixed(now,ZoneOffset.UTC)).verify(body,signature,timestamp));
 }
 @Test void acceptsOnlyFiveMinuteSignatureWindowIncludingBoundaries(){
  assertTrue(auth(now.plusSeconds(300)).verify(body,signature,timestamp));assertTrue(auth(now.minusSeconds(300)).verify(body,signature,timestamp));
  assertFalse(auth(now.plusSeconds(301)).verify(body,signature,timestamp));assertFalse(auth(now.minusSeconds(301)).verify(body,signature,timestamp));
 }
 @Test void missingSecretBadHeadersTimestampOverflowAndOversizedBodyFailClosed(){
  assertFalse(new SepayWebhookAuthenticator("",Clock.fixed(now,ZoneOffset.UTC)).verify(body,signature,timestamp));
  assertFalse(auth(now).verify(body,signature,"9223372036854775807"));assertFalse(auth(now).verify(body,signature,"-1"));
  assertFalse(auth(now).verify(body,signature,"0"+timestamp));assertFalse(auth(now).verify(body,null,timestamp));
  assertFalse(auth(now).verify(body,signature.substring(7),timestamp));assertFalse(auth(now).verify(new byte[65537],signature,timestamp));
 }
}
