package io.github.hienpham0344.stayfinder.payment.service;
import java.util.UUID;
public interface RefundRequestOperations {void request(UUID ownerId,UUID bookingId,long amountUsdCents);}
