package io.github.hienpham0344.stayfinder.booking.dto;
import io.github.hienpham0344.stayfinder.common.dto.MoneyUsd;
public record CancellationPreview(boolean eligible,String reasonCode,MoneyUsd refundAmount,MoneyUsd penalty,
 long pointRestoration,String voucherRestoration,boolean requiresRefundConfirmation){}
