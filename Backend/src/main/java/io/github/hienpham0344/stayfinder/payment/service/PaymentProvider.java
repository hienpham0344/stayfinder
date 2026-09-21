package io.github.hienpham0344.stayfinder.payment.service;

import io.github.hienpham0344.stayfinder.payment.dto.SepayWebhookRequest;

public interface PaymentProvider {
    boolean verifyWebhook(SepayWebhookRequest request);
}
