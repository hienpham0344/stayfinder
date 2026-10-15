package io.github.hienpham0344.stayfinder.media.service;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.beans.factory.annotation.Value;import org.springframework.stereotype.Component;
import javax.crypto.Mac;import javax.crypto.spec.SecretKeySpec;import java.nio.charset.StandardCharsets;import java.security.MessageDigest;import java.time.*;import java.util.*;
@Component public class MediaUrlSigner{
 private final byte[] key;private final Clock clock;
 public MediaUrlSigner(@Value("${stayfinder.media.signing-secret:}") String key,Clock clock){this.key=key.getBytes(StandardCharsets.UTF_8);this.clock=clock;}
 public record Ticket(Instant expiresAt,String signature,String displayUrl){}
 public Ticket ticket(UUID id){Instant expires=clock.instant().truncatedTo(java.time.temporal.ChronoUnit.SECONDS).plusSeconds(900);String signature=sign(id,expires);return new Ticket(expires,signature,"/api/media/"+id+"/content?expires="+expires.getEpochSecond()+"&signature="+signature);}
 public void verify(UUID id,Instant expires,String signature){
  Instant now=clock.instant();if(expires==null||signature==null||!signature.matches("[0-9a-f]{64}")||!now.isBefore(expires)||expires.isAfter(now.plusSeconds(900)))throw new BusinessException(ErrorCode.MEDIA_INVALID);
  if(!MessageDigest.isEqual(sign(id,expires).getBytes(StandardCharsets.US_ASCII),signature.getBytes(StandardCharsets.US_ASCII)))throw new BusinessException(ErrorCode.MEDIA_INVALID);
 }
 private String sign(UUID id,Instant expires){if(key.length<32||key.length>2048)throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);try{var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(key,"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(("stayfinder.media.v1."+id+"."+expires.getEpochSecond()).getBytes(StandardCharsets.UTF_8)));}catch(java.security.GeneralSecurityException e){throw new IllegalStateException("Media signing unavailable");}}
}
