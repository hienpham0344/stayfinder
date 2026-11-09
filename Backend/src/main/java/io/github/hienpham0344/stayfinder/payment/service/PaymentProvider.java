package io.github.hienpham0344.stayfinder.payment.service;

public interface PaymentProvider {
    boolean verifySignedWebhook(byte[] rawBody, String timestamp, String signature);
}
