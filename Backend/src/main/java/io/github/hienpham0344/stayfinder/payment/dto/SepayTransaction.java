package io.github.hienpham0344.stayfinder.payment.dto;
import java.time.Instant;
public record SepayTransaction(String eventId,String gateway,Instant transactionAt,String accountNumber,String subAccount,
 String code,String content,String transferType,long transferAmount,String referenceCode){}
