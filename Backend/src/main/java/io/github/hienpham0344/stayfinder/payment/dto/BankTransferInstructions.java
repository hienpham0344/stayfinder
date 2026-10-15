package io.github.hienpham0344.stayfinder.payment.dto;
public record BankTransferInstructions(String currency,long amount,String usdToVndRate,String rateVersion,String transferReference,
 String bankName,String accountNumber,String accountHolder,String qrImageUrl,String environment){}
