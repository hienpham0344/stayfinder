package io.github.hienpham0344.stayfinder.management;

import io.github.hienpham0344.stayfinder.common.enums.PaymentStatus;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.management.mapper.ManagementMapper;
import io.github.hienpham0344.stayfinder.management.repository.ManagementBookingDetailRepository;
import io.github.hienpham0344.stayfinder.management.repository.ManagementBookingRepository;
import io.github.hienpham0344.stayfinder.management.repository.ManagementPaymentRepository;
import io.github.hienpham0344.stayfinder.management.repository.ManagementPaymentAnomalyRepository;
import io.github.hienpham0344.stayfinder.management.service.OperationsQueryService;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OperationsQueryServiceTest {
    private final ManagementBookingRepository bookings = mock(ManagementBookingRepository.class);
    private final ManagementBookingDetailRepository details = mock(ManagementBookingDetailRepository.class);
    private final ManagementPaymentRepository payments = mock(ManagementPaymentRepository.class);
    private final OperationsQueryService service = new OperationsQueryService(bookings, details, payments,
            mock(ManagementPaymentAnomalyRepository.class), Mappers.getMapper(ManagementMapper.class));
    private final UUID partnerId = UUID.randomUUID();

    @BeforeEach
    void login() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CurrentUser(partnerId, "partner@example.invalid", UserRole.PARTNER), null, List.of()));
    }

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    @Test
    void foreignBookingAndPaymentAreNotReadThroughUnscopedRepositories() {
        UUID foreignId = UUID.randomUUID();
        when(bookings.findOwnedById(foreignId, partnerId)).thenReturn(Optional.empty());
        when(payments.findOwnedById(foreignId, partnerId)).thenReturn(Optional.empty());

        assertEquals(ErrorCode.BOOKING_NOT_FOUND, assertThrows(BusinessException.class,
                () -> service.partnerBooking(foreignId)).getErrorCode());
        assertEquals(ErrorCode.PAYMENT_NOT_FOUND, assertThrows(BusinessException.class,
                () -> service.partnerPayment(foreignId)).getErrorCode());

        verify(bookings, never()).findById(any());
        verify(payments, never()).findById(any());
        verifyNoInteractions(details);
    }

    @Test
    void partnerRevenueUsesOnlySuccessfulPaymentsAndEmptyCountsAreZero() {
        ManagementBookingRepository.BookingCounts counts = mock(ManagementBookingRepository.BookingCounts.class);
        when(bookings.countsOwned(eq(partnerId), any(), any(), any())).thenReturn(counts);
        when(payments.receivedRevenueOwned(partnerId, PaymentStatus.SUCCESS)).thenReturn(BigDecimal.valueOf(250000));

        var result = service.partnerStatistics();

        assertEquals(0, result.totalBookings());
        assertEquals(0, result.pendingBookings());
        assertEquals(BigDecimal.valueOf(250000), result.receivedRevenue());
        verify(payments).receivedRevenueOwned(partnerId, PaymentStatus.SUCCESS);
        verify(bookings, never()).countsAll(any(), any(), any());
        verify(payments, never()).receivedRevenueAll(any());
    }
}
