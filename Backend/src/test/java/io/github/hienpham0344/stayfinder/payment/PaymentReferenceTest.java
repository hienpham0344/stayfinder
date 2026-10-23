package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.payment.service.PaymentReference;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
class PaymentReferenceTest {
 @Test void generatesOpaqueProviderCompatibleSfPrefixAndTenCharacterSuffix(){
  String ref=PaymentReference.create(UUID.randomUUID());assertTrue(ref.matches("SF[A-Z0-9]{10}"));
 }
 @Test void exactSingleContentReferenceWorksWithOrWithoutNativeParsedCode(){
  assertEquals("SF1234567890",PaymentReference.resolve(null,"transfer SF1234567890 paid"));
  assertEquals("SF1234567890",PaymentReference.resolve("SF1234567890","sf1234567890 chuyển tiền"));
 }
 @Test void conflictingMultipleTruncatedEmbeddedAndCodeOnlyReferencesAreNotMatched(){
  assertNull(PaymentReference.resolve("SF1234567890","SF0987654321 paid"));
  assertNull(PaymentReference.resolve(null,"SF1234567890 SF0987654321"));
  assertNull(PaymentReference.resolve(null,"SF123456789"));
  assertNull(PaymentReference.resolve(null,"XSF1234567890Y"));
  assertNull(PaymentReference.resolve("SF1234567890","no reference"));
 }
}
