package io.github.hienpham0344.stayfinder.payment.service;

import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentOperations;
import io.github.hienpham0344.stayfinder.booking.service.BookingPaymentView;
import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.payment.dto.CreatePaymentRequest;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentResponse;
import io.github.hienpham0344.stayfinder.payment.dto.SepayWebhookRequest;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.mapper.PaymentMapper;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentMethodRepository;
import io.github.hienpham0344.stayfinder.payment.repository.PaymentRepository;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final BookingPaymentOperations bookingPaymentOperations;
    private final PaymentProvider paymentProvider;
    private final PaymentMapper mapper;

    public PaymentServiceImpl(PaymentRepository paymentRepository, PaymentMethodRepository paymentMethodRepository,
                              BookingPaymentOperations bookingPaymentOperations, PaymentProvider paymentProvider, PaymentMapper mapper) {
        this.paymentRepository = paymentRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.bookingPaymentOperations = bookingPaymentOperations;
        this.paymentProvider = paymentProvider;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public PaymentResponse create(UUID bookingId, CreatePaymentRequest request) {
        BookingPaymentView booking = ownedBooking(bookingId);
        if (request != null && request.paymentMethodId() != null
                && !paymentMethodRepository.existsById(request.paymentMethodId())) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }
        Payment existing = paymentRepository.findByBookingId(bookingId).stream().findFirst().orElse(null);
        if (existing != null) return mapper.toResponse(existing);
        Payment payment = new Payment();
        payment.setBookingId(booking.id());
        payment.setPaymentMethodId(request == null ? null : request.paymentMethodId());
        payment.setAmount(booking.totalPrice());
        payment.setStatus(PaymentStatus.PENDING);
        return mapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> list(UUID bookingId) {
        ownedBooking(bookingId);
        return paymentRepository.findByBookingId(bookingId).stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional
    public PaymentResponse handleWebhook(SepayWebhookRequest request) {
        if (!paymentProvider.verifyWebhook(request)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        Payment existingByTransaction = paymentRepository.findByTransactionId(request.transactionId()).orElse(null);
        if (existingByTransaction != null) return mapper.toResponse(existingByTransaction);
        BookingPaymentView booking = bookingPaymentOperations.find(request.bookingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.totalPrice() == null || booking.totalPrice().compareTo(request.amount()) != 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        Payment payment = paymentRepository.findByBookingId(booking.id()).stream().findFirst()
                .orElseGet(Payment::new);
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return mapper.toResponse(payment);
        }
        payment.setBookingId(booking.id());
        payment.setAmount(request.amount());
        payment.setTransactionId(request.transactionId());
        payment.setStatus(request.status());
        Payment saved = paymentRepository.save(payment);
        if (request.status() == PaymentStatus.SUCCESS) {
            bookingPaymentOperations.confirm(booking.id());
        }
        return mapper.toResponse(saved);
    }

    private BookingPaymentView ownedBooking(UUID bookingId) {
        return bookingPaymentOperations.findOwned(bookingId, CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND));
    }
}
