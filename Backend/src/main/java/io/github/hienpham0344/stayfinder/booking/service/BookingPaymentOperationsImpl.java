package io.github.hienpham0344.stayfinder.booking.service;

import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;
import io.github.hienpham0344.stayfinder.common.enums.BookingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class BookingPaymentOperationsImpl implements BookingPaymentOperations {
    private final BookingRepository bookingRepository;

    public BookingPaymentOperationsImpl(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BookingPaymentView> find(UUID bookingId) {
        return bookingRepository.findById(bookingId).map(item -> new BookingPaymentView(
                item.getId(), item.getUserId(), item.getTotalPrice(), item.getStatus()));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BookingPaymentView> findOwned(UUID bookingId, UUID userId) {
        return bookingRepository.findByIdAndUserId(bookingId, userId).map(item -> new BookingPaymentView(
                item.getId(), item.getUserId(), item.getTotalPrice(), item.getStatus()));
    }

    @Override
    @Transactional
    public void confirm(UUID bookingId) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            if (booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.CONFIRMED);
                bookingRepository.save(booking);
            }
        });
    }
}
