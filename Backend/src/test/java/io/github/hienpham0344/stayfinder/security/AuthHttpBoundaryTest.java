package io.github.hienpham0344.stayfinder.security;

import io.github.hienpham0344.stayfinder.auth.controller.AuthController;
import io.github.hienpham0344.stayfinder.auth.dto.*;
import io.github.hienpham0344.stayfinder.auth.entity.RefreshSession;
import io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository;
import io.github.hienpham0344.stayfinder.auth.service.AuthService;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.config.*;
import io.github.hienpham0344.stayfinder.user.controller.UserController;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.user.service.UserService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers={AuthController.class,UserController.class,io.github.hienpham0344.stayfinder.reward.controller.RewardController.class,io.github.hienpham0344.stayfinder.booking.controller.BookingController.class,io.github.hienpham0344.stayfinder.booking.controller.BookingQuoteController.class,io.github.hienpham0344.stayfinder.booking.controller.BookingCancellationController.class,io.github.hienpham0344.stayfinder.payment.controller.PaymentController.class,io.github.hienpham0344.stayfinder.payment.controller.PaymentMethodController.class,io.github.hienpham0344.stayfinder.demo.controller.DemoPaymentOperationsController.class},properties={
    "spring.security.jwt.secret-base64=MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=",
    "spring.web.cors.allowed-origins=https://demo.example",
    "spring.jackson.deserialization.fail-on-unknown-properties=true"})
@Import({SecurityConfig.class,CorsConfig.class,ClockConfig.class,CurrentUserJwtConverter.class,
    AuthTransport.class,AuthAttemptLimiter.class,CustomUserDetailsService.class})
class AuthHttpBoundaryTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService auth;
    @MockitoBean UserService userService;
    @MockitoBean io.github.hienpham0344.stayfinder.reward.service.RewardService rewards;
    @MockitoBean io.github.hienpham0344.stayfinder.booking.service.BookingService bookings;
    @MockitoBean io.github.hienpham0344.stayfinder.booking.service.BookingLifecycleService lifecycle;
    @MockitoBean io.github.hienpham0344.stayfinder.booking.service.BookingQuoteService quotes;
    @MockitoBean io.github.hienpham0344.stayfinder.payment.service.PaymentService payments;
    @MockitoBean io.github.hienpham0344.stayfinder.payment.service.SepayReceiptService receipts;
    @MockitoBean io.github.hienpham0344.stayfinder.payment.service.PaymentProvider paymentProvider;
    @MockitoBean io.github.hienpham0344.stayfinder.demo.service.DemoPaymentOperationsService demoOperations;
    @MockitoBean UserRepository users;
    @MockitoBean RefreshSessionRepository sessions;
    private final UUID id=UUID.randomUUID(),sid=UUID.randomUUID();
    private UserResponse profile;
    private AuthSessionResponse response;
    private RefreshSession live;

    @BeforeEach void setup() {
        profile=new UserResponse(id,"Hien","hien@example.com",null,UserRole.CUSTOMER,null,0L,0);
        response=new AuthSessionResponse("test-access","Bearer",Instant.now().plusSeconds(900),sid,profile,"test-refresh");
        when(auth.register(any())).thenReturn(response);when(auth.login(any())).thenReturn(response);when(auth.refresh(any())).thenReturn(response);
        when(userService.getCurrentUser()).thenReturn(profile);
        User u=new User();u.setId(id);u.setEmail(profile.email());u.setRole(UserRole.CUSTOMER);
        u.setCredentialState("active");u.setPasswordHash("test-hash");
        live=new RefreshSession();live.setId(sid);live.setUserId(id);live.setExpiresAt(Instant.now().plusSeconds(9000));
        when(users.findById(id)).thenReturn(Optional.of(u));when(sessions.findById(sid)).thenReturn(Optional.of(live));
    }
    @Test void paymentMethodsArePublicAndDisabledBankHasNoFakeInstructions() throws Exception {
        mvc.perform(get("/api/payment-methods")).andExpect(status().isOk())
            .andExpect(jsonPath("$.result[0].method").value("bank_transfer")).andExpect(jsonPath("$.result[0].enabled").value(false))
            .andExpect(jsonPath("$.result[1].method").value("pay_at_property")).andExpect(jsonPath("$.result[1].enabled").value(true));
    }
    @Test void paymentCreateUsesAuthenticatedOwnerAndRejectsLegacyAmountOrMissingKey() throws Exception {
        UUID bid=UUID.randomUUID();String path="/api/bookings/"+bid+"/payments",token=accessToken();
        mvc.perform(post(path).contentType("application/json").content("{\"method\":\"bank_transfer\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post(path).header("Authorization","Bearer "+token).contentType("application/json").content("{\"method\":\"bank_transfer\"}")).andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization","Bearer "+token).header("Idempotency-Key","pay-1").contentType("application/json")
            .content("{\"method\":\"bank_transfer\",\"amount\":1}")).andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization","Bearer "+token).header("Idempotency-Key","pay-1").contentType("application/json")
            .content("{\"paymentMethodId\":\""+UUID.randomUUID()+"\"}")).andExpect(status().isBadRequest());
        verifyNoInteractions(payments);
        mvc.perform(post(path).header("Authorization","Bearer "+token).header("Idempotency-Key","pay-1").contentType("application/json")
            .content("{\"method\":\"bank_transfer\"}")).andExpect(status().isOk());
        verify(payments).create(id,bid,"bank_transfer","pay-1");
    }
    @Test void paymentStatusRequiresBearerAndPassesOnlyCurrentOwner() throws Exception {
        UUID paymentId=UUID.randomUUID();
        mvc.perform(get("/api/payments/"+paymentId+"/status")).andExpect(status().isUnauthorized());verifyNoInteractions(payments);
        mvc.perform(get("/api/payments/"+paymentId+"/status").header("Authorization","Bearer "+accessToken())).andExpect(status().isOk());
        verify(payments).getOwned(id,paymentId);
    }
    @Test void nativeWebhookPreservesRawUtf8AndUsesOnlyProviderAcknowledgement() throws Exception {
        byte[] raw="{ \"synthetic\": \"chuyển tiền\" }".getBytes(StandardCharsets.UTF_8);
        when(receipts.receive(any(),any(),any())).thenReturn(new io.github.hienpham0344.stayfinder.payment.dto.ProviderAcknowledgement(true));
        mvc.perform(post("/api/payments/webhook/sepay").header("X-SePay-Signature","fixture-signature").header("X-SePay-Timestamp","fixture-timestamp")
            .contentType("application/json").content(raw)).andExpect(status().isOk()).andExpect(content().json("{\"success\":true}"))
            .andExpect(jsonPath("$.result").doesNotExist());
        verify(receipts).receive(aryEq(raw),eq("fixture-signature"),eq("fixture-timestamp"));
    }
    @Test void webhookFailureReturnsNoSuccessfulAcknowledgementAndBodyReadIsBounded() throws Exception {
        when(receipts.receive(any(),any(),any())).thenThrow(new io.github.hienpham0344.stayfinder.common.exception.BusinessException(
            io.github.hienpham0344.stayfinder.common.exception.ErrorCode.UNAUTHORIZED));
        mvc.perform(post("/api/payments/webhook/sepay").contentType("application/json").content("{}")).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").doesNotExist());
        reset(receipts);when(receipts.receive(any(),any(),any())).thenThrow(new IllegalStateException("Synthetic receipt outage"));
        mvc.perform(post("/api/payments/webhook/sepay").contentType("application/json").content(new byte[70000])).andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.success").doesNotExist());
        verify(receipts).receive(argThat(raw->raw.length==65537),isNull(),isNull());
    }

    @Test void demoOperatorRoutesDenyUserAndRequireAdminKeyAndServerAmount() throws Exception {
        String path="/api/demo/bookings/"+UUID.randomUUID()+"/settle";
        mvc.perform(post(path)).andExpect(status().isUnauthorized());
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","demo-1").contentType("application/json").content("{}"))
            .andExpect(status().isForbidden());verifyNoInteractions(demoOperations);
        var admin=users.findById(id).orElseThrow();admin.setRole(UserRole.ADMIN);
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","demo-1").contentType("application/json").content("{\"amount\":1}"))
            .andExpect(status().isBadRequest());verifyNoInteractions(demoOperations);
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","demo-1").contentType("application/json").content("{}"))
            .andExpect(status().isOk());verify(demoOperations).settleAtProperty(eq(id),any(),eq("demo-1"));
    }
    @Test void demoRefundRequiresAdminAndRejectsClientAmountOrEmptyConfirmationReference() throws Exception {
        String path="/api/demo/refunds/"+UUID.randomUUID()+"/confirm";
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","refund-1").contentType("application/json").content("{\"reference\":\"Synthetic ref\"}"))
            .andExpect(status().isForbidden());verifyNoInteractions(demoOperations);
        users.findById(id).orElseThrow().setRole(UserRole.ADMIN);
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","refund-1").contentType("application/json").content("{\"reference\":\"\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","refund-1").contentType("application/json").content("{\"reference\":\"Synthetic ref\",\"amount\":1}"))
            .andExpect(status().isBadRequest());verifyNoInteractions(demoOperations);
        mvc.perform(post(path).header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","refund-1").contentType("application/json").content("{\"reference\":\"Synthetic ref\"}"))
            .andExpect(status().isOk());verify(demoOperations).confirmRefund(eq(id),any(),eq("Synthetic ref"),eq("refund-1"));
    }

    private String accessToken() {
        String secret=Base64.getEncoder().encodeToString("01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
        return new JwtTokenProvider(secret,Clock.systemUTC()).issue(id,sid);
    }
    @Test void cancellationIsOwnerScopedAndRejectsClientAssignedState() throws Exception {
        UUID bid=UUID.randomUUID();
        mvc.perform(get("/api/bookings/"+bid+"/cancellation-preview")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/bookings/"+bid+"/cancel").header("Authorization","Bearer "+accessToken()).contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/bookings/"+bid+"/cancel").header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","cancel-1")
            .contentType("application/json").content("{\"paid\":true,\"refundStatus\":\"confirmed\"}")).andExpect(status().isBadRequest());
        verifyNoInteractions(lifecycle);
        mvc.perform(get("/api/bookings/"+bid+"/cancellation-preview").header("Authorization","Bearer "+accessToken())).andExpect(status().isOk());
        verify(lifecycle).previewCancellation(id,bid);
    }
    @Test void bookingRequiresAuthKeyAndOnlyQuoteGuestSupportedMethodContract() throws Exception {
        mvc.perform(post("/api/bookings").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        String valid="{\"quoteId\":\""+UUID.randomUUID()+"\",\"guest\":{\"fullName\":\"Hien\",\"email\":\"hien@example.com\",\"phone\":\"+84912345678\"},\"paymentMethod\":\"pay_at_property\"}";
        mvc.perform(post("/api/bookings").header("Authorization","Bearer "+accessToken()).contentType("application/json").content(valid))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(post("/api/bookings").header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","book-1")
            .contentType("application/json").content("{\"accommodationId\":\""+UUID.randomUUID()+"\",\"total\":1,\"status\":\"completed\"}"))
            .andExpect(status().isBadRequest());
        verify(bookings,never()).create(any(),any(),any());
    }
    @Test void fractionalGuestCountIsRejectedRatherThanRoundedDown() throws Exception {
        mvc.perform(post("/api/booking-quotes").header("Authorization","Bearer "+accessToken()).contentType("application/json")
            .content("{\"accommodationId\":\""+UUID.randomUUID()+"\",\"roomId\":\""+UUID.randomUUID()+"\",\"checkIn\":\"2026-11-01\",\"checkOut\":\"2026-11-04\",\"quantity\":1,\"adults\":1.9,\"children\":0}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        verifyNoInteractions(quotes);
    }
    @Test void quoteCannotAcceptClientOwnerOrPriceAndUnknownStatusFilterIsRejected() throws Exception {
        mvc.perform(post("/api/booking-quotes").header("Authorization","Bearer "+accessToken()).contentType("application/json")
            .content("{\"userId\":\""+UUID.randomUUID()+"\",\"nightlyPriceCents\":1}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/bookings?status=paid").header("Authorization","Bearer "+accessToken())).andExpect(status().isBadRequest());
        verifyNoInteractions(bookings,quotes);
    }
    @Test void validCreatePassesOnlyAuthenticatedOwnerAndPreservedRequestKey() throws Exception {
        UUID qid=UUID.randomUUID();
        mvc.perform(post("/api/bookings").header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","book-1").contentType("application/json")
            .content("{\"quoteId\":\""+qid+"\",\"guest\":{\"fullName\":\" Hien \",\"email\":\"Hien@example.com\",\"phone\":\"+84912345678\"},\"paymentMethod\":\"pay_at_property\"}"))
            .andExpect(status().isOk());
        verify(bookings).create(eq(id),argThat(r->qid.equals(r.quoteId())&&"Hien".equals(r.guest().fullName())&&"hien@example.com".equals(r.guest().email())),eq("book-1"));
    }
    @Test void missingRewardIdempotencyHeaderIsValidationErrorWithoutMutation() throws Exception {
        mvc.perform(post("/api/rewards/claims").header("Authorization","Bearer "+accessToken())
            .contentType("application/json").content("{\"offerId\":\""+UUID.randomUUID()+"\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        verify(rewards,never()).claim(any(),any(),any());
    }
    @Test void rewardOwnerAndBalanceCannotBeSuppliedByClient() throws Exception {
        mvc.perform(get("/api/rewards/wallet")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/rewards/claims").header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","claim-1")
            .contentType("application/json").content("{\"offerId\":\""+UUID.randomUUID()+"\",\"userId\":\""+UUID.randomUUID()+"\",\"availablePoints\":10000}"))
            .andExpect(status().isBadRequest());
        verify(rewards,never()).claim(any(),any(),any());
    }
    @Test void rewardClaimUsesAuthenticatedOwnerAndExposesDemoContract() throws Exception {
        UUID offerId=UUID.randomUUID();
        var offer=new io.github.hienpham0344.stayfinder.reward.dto.RewardOfferResponse(offerId,"DEMO","Demo voucher",1000,"discount_voucher",true,true,null,"Demo entitlement",
            new io.github.hienpham0344.stayfinder.reward.dto.RewardOfferResponse.Terms(5,
                io.github.hienpham0344.stayfinder.common.dto.MoneyUsd.cents(2500),io.github.hienpham0344.stayfinder.common.dto.MoneyUsd.cents(10000),null,30));
        when(rewards.claim(id,offerId,"claim-1")).thenReturn(new io.github.hienpham0344.stayfinder.reward.dto.RewardClaimResponse(UUID.randomUUID(),offer,"available",Instant.now().plusSeconds(3600)));
        mvc.perform(post("/api/rewards/claims").header("Authorization","Bearer "+accessToken()).header("Idempotency-Key","claim-1")
            .contentType("application/json").content("{\"offerId\":\""+offerId+"\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.result.offer.isDemo").value(true))
            .andExpect(jsonPath("$.result.offer.terms.discountCap.amountCents").value(2500));
        verify(rewards).claim(id,offerId,"claim-1");
    }
    @Test void nativeRegisterReturns201AndExplicitRefresh() throws Exception {
        mvc.perform(post("/api/auth/register").header("X-Client-Platform","native").contentType("application/json")
            .content("{\"fullName\":\"Hien\",\"email\":\"hien@example.com\",\"password\":\"ExamplePass9\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.result.refreshToken").value("test-refresh"))
            .andExpect(jsonPath("$.result.user.role").value("customer"));
    }
    @Test void webLoginReturnsHttpOnlyCookieAndNoRefreshInJson() throws Exception {
        mvc.perform(post("/api/auth/login").header("X-Client-Platform","web").header("Origin","https://demo.example")
            .contentType("application/json").content("{\"email\":\"hien@example.com\",\"password\":\"ExamplePass9\"}"))
            .andExpect(status().isOk()).andExpect(header().string("Set-Cookie",org.hamcrest.Matchers.containsString("HttpOnly")))
            .andExpect(jsonPath("$.result.refreshToken").doesNotExist());
    }
    @Test void refreshAndLogoutAreAvailableWithoutAccessBearer() throws Exception {
        mvc.perform(post("/api/auth/refresh").header("X-Client-Platform","web").header("Origin","https://demo.example")
            .cookie(new Cookie(AuthTransport.COOKIE_NAME,"test-refresh"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.result.accessToken").value("test-access"));
        mvc.perform(post("/api/auth/logout").header("X-Client-Platform","native").contentType("application/json")
            .content("{\"refreshToken\":\"test-refresh\"}")).andExpect(status().isOk());
        verify(auth).logout("test-refresh");
    }
    @Test void nativeFlagCannotExportRefreshToAnOriginBearingBrowser() throws Exception {
        mvc.perform(post("/api/auth/login").header("X-Client-Platform","native").header("Origin","https://demo.example")
            .contentType("application/json").content("{\"email\":\"hien@example.com\",\"password\":\"ExamplePass9\"}"))
            .andExpect(status().isForbidden());
        verify(auth,never()).login(any());
    }
    @Test void protectedEndpointRequiresLiveSessionAndRejectsRevocationImmediately() throws Exception {
        String secret=Base64.getEncoder().encodeToString("01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
        String token=new JwtTokenProvider(secret,Clock.systemUTC()).issue(id,sid);
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").header("Authorization","Bearer "+token)).andExpect(status().isOk());
        live.setRevokedAt(Instant.now());
        mvc.perform(get("/api/users/me").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());
    }
    @Test void registrationRejectsClientOwnedRoleOrPoints() throws Exception {
        mvc.perform(post("/api/auth/register").header("X-Client-Platform","native").contentType("application/json")
            .content("{\"fullName\":\"Hien\",\"email\":\"hien@example.com\",\"password\":\"ExamplePass9\",\"role\":\"admin\"}"))
            .andExpect(status().isBadRequest());
        verify(auth,never()).register(any());
    }
    @Test void profilePatchRejectsRolePointsAndAuthEmailWrites() throws Exception {
        String secret=Base64.getEncoder().encodeToString("01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
        String token=new JwtTokenProvider(secret,Clock.systemUTC()).issue(id,sid);
        for(String body:List.of("{\"role\":\"admin\"}","{\"loyaltyPoints\":9999}","{\"email\":\"other@example.com\"}")) {
            mvc.perform(patch("/api/users/me").header("Authorization","Bearer "+token).contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
        }
        verify(userService,never()).updateProfile(any());
    }
    @Test void corsAllowsOnlyConfiguredOriginWithSessionHeaders() throws Exception {
        mvc.perform(options("/api/auth/refresh").header("Origin","https://demo.example")
            .header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","X-Client-Platform,Idempotency-Key"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","https://demo.example"));
        mvc.perform(options("/api/auth/refresh").header("Origin","https://evil.example")
            .header("Access-Control-Request-Method","POST")).andExpect(status().isForbidden());
    }
}
