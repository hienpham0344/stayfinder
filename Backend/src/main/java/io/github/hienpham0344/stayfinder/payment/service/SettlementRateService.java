package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.math.*;
@Service
public class SettlementRateService {
 public record LockedRate(long amount,String usdToVndRate,String rateVersion){}
 private final BigDecimal rate;private final String version;
 public SettlementRateService(@Value("${stayfinder.payment.demo-usd-vnd-rate:25000}") BigDecimal rate,
  @Value("${stayfinder.payment.demo-rate-version:demo-v1}") String version){
  if(rate==null||rate.signum()<=0||rate.scale()>6||rate.compareTo(new BigDecimal("10000000"))>0
   ||version==null||!version.matches("[A-Za-z0-9._:-]{1,120}"))throw new IllegalArgumentException("Invalid labelled demo rate");
  this.rate=rate.stripTrailingZeros();this.version=version;
 }
 public LockedRate lockRate(long usdCents){
  try{
   MoneyUsd.cents(usdCents);
   long vnd=BigDecimal.valueOf(usdCents).multiply(rate).divide(BigDecimal.valueOf(100),0,RoundingMode.HALF_UP).longValueExact();
   if(vnd<1000||vnd>499000000)throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_UNSUPPORTED);
   return new LockedRate(vnd,rate.toPlainString(),version);
  }catch(IllegalArgumentException|ArithmeticException e){throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_UNSUPPORTED);}
 }
}
