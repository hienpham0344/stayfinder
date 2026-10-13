package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Component;import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.util.UriComponentsBuilder;import java.util.UUID;
@Component
public class SepayPaymentProvider implements PaymentProvider {
 private final boolean testMode;private final String gateway,bankCode,account,holder,subAccount;
 private final SepayWebhookAuthenticator auth;private final SepayNativePayloadParser parser;private final SettlementRateService rates;
 public SepayPaymentProvider(@Value("${SEPAY_TEST_MODE:false}") boolean testMode,@Value("${SEPAY_TEST_BANK_NAME:}") String gateway,
  @Value("${SEPAY_TEST_BANK_CODE:}") String bankCode,@Value("${SEPAY_TEST_ACCOUNT_NUMBER:}") String account,
  @Value("${SEPAY_TEST_ACCOUNT_HOLDER:}") String holder,@Value("${SEPAY_TEST_SUB_ACCOUNT:}") String subAccount,
  SepayWebhookAuthenticator auth,SepayNativePayloadParser parser,SettlementRateService rates){
  this.testMode=testMode;this.gateway=trim(gateway);this.bankCode=trim(bankCode);this.account=trim(account);this.holder=trim(holder);
  this.subAccount=subAccount==null||subAccount.isBlank()?null:subAccount.trim();this.auth=auth;this.parser=parser;this.rates=rates;
 }
 private static String trim(String value){return value==null?"":value.trim();}
 @Override public boolean enabled(){
  return testMode&&auth.configured()&&gateway.matches("[A-Za-z][A-Za-z0-9 _-]{0,159}")&&bankCode.matches("[A-Za-z0-9]{2,32}")
   &&account.matches("[0-9]{6,64}")&&!holder.isBlank()&&holder.length()<=160&&!holder.chars().anyMatch(Character::isISOControl)
   &&(subAccount==null||subAccount.matches("[A-Za-z0-9]{1,64}"));
 }
 @Override public BankSetup createBankInstructions(UUID paymentId,long usdCents){
  if(!enabled())throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
  var fx=rates.lockRate(usdCents);String reference=PaymentReference.create(paymentId),displayAccount=subAccount==null?account:subAccount;
  String qr=UriComponentsBuilder.fromUriString("https://vietqr.app/img").queryParam("acc",displayAccount).queryParam("bank",bankCode)
   .queryParam("amount",fx.amount()).queryParam("des",reference).build().encode().toUriString();
  return new BankSetup(new BankTransferInstructions("VND",fx.amount(),fx.usdToVndRate(),fx.rateVersion(),reference,gateway,displayAccount,holder,qr,"test"),account,subAccount,bankCode);
 }
 @Override public SepayTransaction verifyAndParse(byte[] raw,String signature,String timestamp){
  if(!auth.verify(raw,signature,timestamp))throw new BusinessException(ErrorCode.UNAUTHORIZED);
  if(!enabled())throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
  return parser.parse(raw);
 }
}
