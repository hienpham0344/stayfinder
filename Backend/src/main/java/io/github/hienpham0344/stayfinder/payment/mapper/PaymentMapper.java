package io.github.hienpham0344.stayfinder.payment.mapper;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
import org.mapstruct.*;
@Mapper(componentModel="spring",imports=MoneyUsd.class)
public interface PaymentMapper {
 @Mapping(target="status",expression="java(entity.getStatus().getValue())")
 @Mapping(target="originalAmount",expression="java(MoneyUsd.cents(entity.getOriginalAmountCents()))")
 @Mapping(target="settlement",expression="java(settlement(entity))")
 PaymentResponse toResponse(Payment entity);
 default BankTransferInstructions settlement(Payment p){
  if(!"bank_transfer".equals(p.getMethod()))return null;
  return new BankTransferInstructions("VND",p.getSettlementVnd(),p.getUsdToVndRate(),p.getRateVersion(),p.getTransferReference(),
   p.getBankName(),p.getBankSubAccount()==null?p.getBankAccountNumber():p.getBankSubAccount(),p.getBankAccountHolder(),p.getQrImageUrl(),p.getEnvironment());
 }
}
