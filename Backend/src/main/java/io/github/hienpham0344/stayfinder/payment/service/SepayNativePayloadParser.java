package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.dto.SepayTransaction;
import io.github.hienpham0344.stayfinder.common.exception.*;
import tools.jackson.databind.*;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.core.StreamReadFeature;
import org.springframework.stereotype.Component;
import java.time.*;
import java.time.format.*;
@Component
public class SepayNativePayloadParser {
 private final JsonMapper mapper;
 private static final DateTimeFormatter DATE=DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss").withResolverStyle(ResolverStyle.STRICT);
 public SepayNativePayloadParser(JsonMapper mapper){
  this.mapper=mapper.rebuild().enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION).enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).build();
 }
 public SepayTransaction parse(byte[] raw){
  if(raw==null||raw.length==0||raw.length>SepayWebhookAuthenticator.MAX_BODY_BYTES)throw invalid();
  try{
   JsonNode n=mapper.readTree(raw);if(n==null||!n.isObject())throw invalid();
   long id=positiveInteger(n,"id"),amount=positiveInteger(n,"transferAmount");
   if(amount>9_007_199_254_740_991L)throw invalid();
   String direction=required(n,"transferType",3);
   if(!direction.equals("in")&&!direction.equals("out"))throw invalid();
   Instant at=LocalDateTime.parse(required(n,"transactionDate",19),DATE).toInstant(ZoneOffset.ofHours(7));
   return new SepayTransaction(Long.toString(id),required(n,"gateway",160),at,required(n,"accountNumber",64),
    optional(n,"subAccount",64),optional(n,"code",100),required(n,"content",4096),direction,amount,optional(n,"referenceCode",160));
  }catch(BusinessException e){throw e;}
  catch(RuntimeException e){throw invalid();}
 }
 private static long positiveInteger(JsonNode n,String key){
  var v=n.get(key);if(v==null||!v.isIntegralNumber()||!v.canConvertToLong()||v.longValue()<1)throw invalid();return v.longValue();
 }
 private static String required(JsonNode n,String key,int max){
  String value=optional(n,key,max);if(value==null||value.isBlank())throw invalid();return value;
 }
 private static String optional(JsonNode n,String key,int max){
  var v=n.get(key);if(v==null||v.isNull())return null;if(!v.isString())throw invalid();
  String value=v.stringValue();if(value.length()>max)throw invalid();return value;
 }
 private static BusinessException invalid(){return new BusinessException(ErrorCode.VALIDATION_ERROR);}
}
