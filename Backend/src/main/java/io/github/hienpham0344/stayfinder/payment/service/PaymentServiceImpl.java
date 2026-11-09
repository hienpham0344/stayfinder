package io.github.hienpham0344.stayfinder.payment.service;

import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentOperations;
import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentView;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.payment.dto.CreatePaymentRequest;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentMethodRepository;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.time.Instant;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final BookingPaymentOperations bookingPaymentOperations;
    private final PaymentMapper mapper;
    private final String receivingAccountNumber;

    public PaymentServiceImpl(PaymentRepository paymentRepository, PaymentMethodRepository paymentMethodRepository,
                              BookingPaymentOperations bookingPaymentOperations, PaymentMapper mapper,
                              @Value("${SEPAY_BANK_ACCOUNT_NUMBER:}") String receivingAccountNumber) {
        this.paymentRepository = paymentRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.bookingPaymentOperations = bookingPaymentOperations;
        this.mapper = mapper;
        this.receivingAccountNumber = receivingAccountNumber;
    }

    @Override
    @Transactional
    public PaymentResponse create(UUID bookingId, CreatePaymentRequest request) {
        BookingPaymentView booking = bookingPaymentOperations.findOwnedForUpdate(bookingId, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.status() != BookingStatus.PENDING) {
            throw new BusinessException(ErrorCode.BOOKING_INVALID_STATE);
        }
        if (booking.totalPrice() == null || booking.totalPrice().signum() <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        if (receivingAccountNumber.isBlank()) {
            throw new IllegalStateException("SEPAY_BANK_ACCOUNT_NUMBER must be configured before creating payments");
        }
        if (request != null && request.paymentMethodId() != null
                && !paymentMethodRepository.existsById(request.paymentMethodId())) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }
        Payment existing = paymentRepository.findByBookingId(bookingId).stream()
                .filter(item -> item.getStatus() == PaymentStatus.PENDING).findFirst().orElse(null);
        if (existing != null) return toResponse(existing);
        Payment payment = new Payment();
        payment.setBookingId(booking.id());
        payment.setPaymentMethodId(request == null ? null : request.paymentMethodId());
        payment.setAmount(booking.totalPrice());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(Instant.now());
        return toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> list(UUID bookingId) {
        ownedBooking(bookingId);
        return paymentRepository.findByBookingId(bookingId).stream().map(this::toResponse).toList();
    }

    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse response = mapper.toResponse(payment);
        return new PaymentResponse(response.id(), response.bookingId(), response.paymentMethodId(),
                response.amount(), response.transactionId(), response.status(), response.createdAt(),
                response.paymentCode(), receivingAccountNumber);
    }

    private BookingPaymentView ownedBooking(UUID bookingId) {
        return bookingPaymentOperations.findOwned(bookingId, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
    }
}
