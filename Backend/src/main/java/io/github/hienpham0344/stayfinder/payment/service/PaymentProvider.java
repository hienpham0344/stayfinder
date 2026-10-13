package io.github.hienpham0344.stayfinder.payment.service;
import io.github.hienpham0344.stayfinder.payment.dto.*;
import java.util.UUID;
public interface PaymentProvider {
 record BankSetup(BankTransferInstructions instructions,String receivingAccountNumber,String subAccount,String bankCode){}
 boolean enabled();
 BankSetup createBankInstructions(UUID paymentId,long usdCents);
 SepayTransaction verifyAndParse(byte[] rawBody,String signature,String timestamp);
}
