package io.github.hienpham0344.stayfinder.payment;
import io.github.hienpham0344.stayfinder.payment.service.SettlementRateService;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
class SettlementRateServiceTest {
 @Test void convertsExactUsdCentsAndRetainsOriginalRateVersionAfterConfigurationChanges(){
  var old=new SettlementRateService(new BigDecimal("25000"),"demo-v1").lockRate(103200);
  var fresh=new SettlementRateService(new BigDecimal("26000"),"demo-v2").lockRate(103200);
  assertEquals(25800000,old.amount());assertEquals("25000",old.usdToVndRate());assertEquals("demo-v1",old.rateVersion());
  assertEquals(26832000,fresh.amount());assertEquals("demo-v2",fresh.rateVersion());assertEquals(25800000,old.amount());
 }
 @Test void roundsHalfUpToWholeVndAndRespectsSimulatorBounds(){
  assertEquals(12500,new SettlementRateService(new BigDecimal("25000.5"),"demo-v1").lockRate(50).amount());
  assertEquals(12501,new SettlementRateService(new BigDecimal("25001"),"demo-v1").lockRate(50).amount());
  var rate=new SettlementRateService(new BigDecimal("25000"),"demo-v1");
  assertEquals(1000,rate.lockRate(4).amount());assertEquals(499000000,rate.lockRate(1996000).amount());
  assertThrows(BusinessException.class,()->rate.lockRate(3));assertThrows(BusinessException.class,()->rate.lockRate(1996001));
  assertThrows(BusinessException.class,()->rate.lockRate(9_007_199_254_740_991L));
 }
 @Test void cannotConfigureNegativeRateOrUnlabelledVersion(){
  assertThrows(IllegalArgumentException.class,()->new SettlementRateService(BigDecimal.ZERO,"demo"));
  assertThrows(IllegalArgumentException.class,()->new SettlementRateService(new BigDecimal("25000"),""));
 }
}
