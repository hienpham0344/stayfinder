package io.github.hienpham0344.stayfinder.payment.service;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.*;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.HexFormat;
@Component
public class SepayWebhookAuthenticator {
 public static final int MAX_BODY_BYTES=65536;
 private final byte[] secret;private final Clock clock;
 public SepayWebhookAuthenticator(@Value("${SEPAY_WEBHOOK_SECRET:}") String secret,Clock clock){
  this.secret=secret==null?new byte[0]:secret.getBytes(StandardCharsets.UTF_8);this.clock=clock;
 }
 public boolean configured(){return secret.length>=32&&secret.length<=2048;}
 public boolean verify(byte[] raw,String signature,String timestamp){
  if(!configured()||raw==null||raw.length<1||raw.length>MAX_BODY_BYTES||signature==null
   ||!signature.matches("sha256=[0-9a-f]{64}")||timestamp==null||!timestamp.matches("[1-9][0-9]{0,18}"))return false;
  try{
   long signedAt=Long.parseLong(timestamp),now=clock.instant().getEpochSecond();
   if(signedAt<now-300||signedAt>now+300)return false;
   Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret,"HmacSHA256"));
   mac.update((timestamp+".").getBytes(StandardCharsets.US_ASCII));
   return MessageDigest.isEqual(mac.doFinal(raw),HexFormat.of().parseHex(signature.substring(7)));
  }catch(GeneralSecurityException|IllegalArgumentException e){return false;}
 }
}
