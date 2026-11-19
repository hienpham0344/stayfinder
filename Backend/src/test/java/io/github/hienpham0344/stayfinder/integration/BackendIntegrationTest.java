package io.github.hienpham0344.stayfinder.integration;

import io.github.hienpham0344.stayfinder.booking.service.BookingLifecycleService;
import io.github.hienpham0344.stayfinder.common.enums.UserRole;
import io.github.hienpham0344.stayfinder.config.CacheConfig;
import io.github.hienpham0344.stayfinder.security.JwtService;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfSystemProperty(named = "stayfinder.integration", matches = "true")
class BackendIntegrationTest {
    static final UUID ADMIN = id(1), USER = id(2), OTHER = id(3), PARTNER = id(4), OTHER_PARTNER = id(5);
    static final UUID STAY = id(10), OTHER_STAY = id(11), ROOM = id(20), OTHER_ROOM = id(21), TYPE = id(30), FEATURE = id(31);
    static final UUID CATALOG = id(101);
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;
    @Autowired JwtService jwt;
    @Autowired PasswordEncoder passwords;
    @Autowired BookingLifecycleService lifecycle;
    @Autowired EntityManagerFactory emf;
    @Autowired MutableClock clock;
    @Autowired org.springframework.cache.CacheManager cacheManager;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
    @Autowired org.springframework.context.ApplicationEventPublisher events;
    @Autowired io.github.hienpham0344.stayfinder.accommodation.repository.AccommodationRepository accommodations;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("requestMappingHandlerMapping")
    org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping routes;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean
    io.github.hienpham0344.stayfinder.accommodation.repository.ImageRepository images;

    @TestConfiguration
    static class TimeFixture {
        @Bean @Primary MutableClock testClock() { return new MutableClock(); }
    }
    static class MutableClock extends Clock {
        private final AtomicReference<Instant> value = new AtomicReference<>(Instant.parse("2027-01-01T00:00:00Z"));
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return Clock.fixed(instant(), zone); }
        public Instant instant() { return value.get(); }
        void set(Instant now) { value.set(now); }
    }

    @BeforeEach
    void fixture() {
        String database = jdbc.queryForObject("select current_database()", String.class);
        if (!"stayfinder_test".equals(database)) throw new IllegalStateException("Refusing fixture outside stayfinder_test");
        jdbc.execute("truncate payment_anomalies,reward_ledger,reward_vouchers,reward_catalog,audit_logs,partner_applications,"
                + "reviews,favorites,payments,booking_details,bookings,room_snapshot,accommodation_snapshot,"
                + "accommodation_features,images,room,accommodations,room_type,accommodation_type,features,payments_method,users");
        clock.set(Instant.parse("2027-01-01T00:00:00Z"));
        for (UUID id : List.of(ADMIN, USER, OTHER, PARTNER, OTHER_PARTNER)) {
            String role = id.equals(ADMIN) ? "admin" : id.equals(PARTNER) || id.equals(OTHER_PARTNER) ? "partner" : "customer";
            jdbc.update("insert into users(id,full_name,email,password_hash,role,loyalty_points,loyalty_tier,created_at) values(?,?,?,?,?,2000,1,?)",
                    id, "Test account", id + "@example.test", passwords.encode("test-password"), role, java.sql.Timestamp.from(clock.instant()));
            jdbc.update("insert into reward_ledger(id,user_id,delta,balance_after,source_type,source_id,idempotency_key,created_at) values(?,?,2000,2000,'OPENING',?,'opening',?)",
                    UUID.randomUUID(), id, id, java.sql.Timestamp.from(clock.instant()));
        }
        jdbc.update("insert into accommodation_type(id,name) values(?,'Hotel')", TYPE);
        jdbc.update("insert into room_type(id,name) values(?,'Standard')", TYPE);
        jdbc.update("insert into features(id,name) values(?,'Pool')", FEATURE);
        for (UUID id : List.of(STAY, OTHER_STAY)) {
            jdbc.update("insert into accommodations(id,partner_id,type_id,name,address,base_price,status,created_at) values(?,?,?,'Hà Nội Stay','Hà Nội',50000,'active',?)",
                    id, id.equals(STAY) ? PARTNER : OTHER_PARTNER, TYPE, java.sql.Timestamp.from(clock.instant()));
            jdbc.update("insert into room(id,accommodation_id,room_type_id,name,price,status,capacity,created_at) values(?,?,?,'Family',100000,'available',4,?)",
                    id.equals(STAY) ? ROOM : OTHER_ROOM, id, TYPE, java.sql.Timestamp.from(clock.instant()));
            jdbc.update("insert into accommodation_features(accommodation_id,features_id) values(?,?)", id, FEATURE);
            jdbc.update("insert into images(id,accommodation_id,url) values(?,?,?)", UUID.randomUUID(), id, "https://example.test/approved.jpg");
        }
        // A cheap room cannot satisfy a four-guest search; matched rate must remain 100000.
        jdbc.update("insert into room(id,accommodation_id,room_type_id,name,price,status,capacity,created_at) values(?,?,?,'Single',50000,'available',1,?)",
                id(22), STAY, TYPE, java.sql.Timestamp.from(clock.instant()));
        jdbc.update("insert into reward_catalog(id,name,points_cost,discount_amount,min_spend,validity_days,enabled,created_at) values(?,'Discount',1000,10000,100000,30,true,?)",
                CATALOG, java.sql.Timestamp.from(clock.instant()));
    }

    @Test
    void publicSearchFiltersMatchingRoomsAndHidesInactiveProperties() throws Exception {
        JsonNode page = result(get("/api/accommodations").param("guests", "4").param("maxPrice", "90000"), null, 200);
        assertEquals(0, page.path("content").size());
        page = result(get("/api/accommodations").param("guests", "4").param("featureIds", FEATURE.toString()), null, 200);
        assertEquals(2, page.path("content").size());
        assertEquals(100000, page.path("content").get(0).path("matchedPrice").asInt());
        jdbc.update("update accommodations set status='inactive' where id=?", STAY);
        result(get("/api/accommodations/" + STAY), null, 404);
        result(get("/api/accommodations/" + STAY + "/reviews/page"), null, 404);
        result(get("/api/accommodations").param("checkIn", "2027-01-02"), null, 400);
    }

    @Test
    void ownershipCapacityAndConcurrentBookingAreEnforcedByPostgres() throws Exception {
        result(post("/api/bookings").contentType("application/json").content(bookingBody(ROOM, 5, null)), USER, 409);
        List<MvcResult> raced = concurrent(2, () -> mvc.perform(post("/api/bookings").header("Authorization", bearer(USER))
                .contentType("application/json").content(bookingBody(ROOM, 4, null))).andReturn());
        assertEquals(1, raced.stream().filter(r -> r.getResponse().getStatus() == 200).count());
        assertTrue(raced.stream().allMatch(r -> List.of(200, 409).contains(r.getResponse().getStatus())));
        UUID booking = jdbc.queryForObject("select id from bookings", UUID.class);
        result(get("/api/bookings/" + booking), OTHER, 404);
        result(post("/api/bookings/" + booking + "/cancel"), OTHER, 404);
        result(get("/api/bookings/" + booking + "/payments"), OTHER, 404);
        result(get("/api/partner/bookings/" + booking), OTHER_PARTNER, 404);
        result(get("/api/partner/bookings/" + booking), PARTNER, 200);
    }

    @Test
    void concurrentRedemptionsAndRetriesCannotOverspendPoints() throws Exception {
        String key = UUID.randomUUID().toString();
        String body = "{\"catalogId\":\"" + CATALOG + "\",\"idempotencyKey\":\"" + key + "\"}";
        List<MvcResult> raced = concurrent(6, () -> mvc.perform(post("/api/rewards/redeem").header("Authorization", bearer(USER))
                .contentType("application/json").content(body)).andReturn());
        assertTrue(raced.stream().allMatch(r -> r.getResponse().getStatus() == 200));
        assertEquals(1, jdbc.queryForObject("select count(*) from reward_vouchers where user_id=?", Integer.class, USER));
        assertEquals(1000, jdbc.queryForObject("select loyalty_points from users where id=?", Integer.class, USER));
        var competing = concurrent(4, () -> mvc.perform(post("/api/rewards/redeem").header("Authorization", bearer(USER))
                .contentType("application/json").content("{\"catalogId\":\"" + CATALOG + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")).andReturn());
        assertEquals(1, competing.stream().filter(r -> r.getResponse().getStatus() == 200).count());
        assertTrue(competing.stream().allMatch(r -> List.of(200, 400).contains(r.getResponse().getStatus())));
        assertEquals(0, jdbc.queryForObject("select loyalty_points from users where id=?", Integer.class, USER));
        assertEquals(2, jdbc.queryForObject("select count(*) from reward_vouchers where user_id=?", Integer.class, USER));
    }

    @Test
    void discountedPaymentReplayCompletionAndReviewFormAConsistentFlow() throws Exception {
        UUID voucher = redeem();
        JsonNode created = result(post("/api/bookings").contentType("application/json").content(bookingBody(ROOM, 4, voucher)), USER, 200);
        UUID booking = UUID.fromString(created.path("id").asText());
        assertEquals(190000, created.path("totalPrice").asInt());
        JsonNode payment = result(post("/api/bookings/" + booking + "/payments"), USER, 200);
        String payload = webhook(payment.path("paymentCode").asText(), 190000, 1001);
        var replies = concurrent(6, () -> signedWebhook(payload));
        assertTrue(replies.stream().allMatch(r -> r.getResponse().getStatus() == 200));
        assertEquals("confirmed", jdbc.queryForObject("select status from bookings where id=?", String.class, booking));
        assertEquals("USED", jdbc.queryForObject("select status from reward_vouchers where id=?", String.class, voucher));
        result(post("/api/bookings/" + booking + "/cancel"), USER, 409);
        clock.set(Instant.parse("2027-01-04T05:00:00Z"));
        concurrent(3, () -> { lifecycle.complete(booking); return true; });
        assertEquals("completed", jdbc.queryForObject("select status from bookings where id=?", String.class, booking));
        assertEquals(1190, jdbc.queryForObject("select loyalty_points from users where id=?", Integer.class, USER));
        assertEquals(1, jdbc.queryForObject("select count(*) from reward_ledger where idempotency_key=?", Integer.class, "COMPLETED:" + booking));
        String review = "{\"bookingId\":\"" + booking + "\",\"rating\":5,\"comment\":\"Good stay\"}";
        JsonNode posted = result(post("/api/accommodations/" + STAY + "/reviews").contentType("application/json").content(review), USER, 200);
        result(post("/api/accommodations/" + STAY + "/reviews").contentType("application/json").content(review), USER, 409);
        result(post("/api/admin/reviews/" + posted.path("id").asText() + "/moderation").contentType("application/json")
                .content("{\"hidden\":true,\"reason\":\"test\",\"version\":0}"), ADMIN, 200);
        assertEquals(0, result(get("/api/accommodations/" + STAY + "/reviews/page"), null, 200).path("content").size());
        assertEquals(190000, result(get("/api/admin/statistics"), ADMIN, 200).path("receivedRevenue").asInt());
    }

    @Test
    void expiryReleasesRoomWithoutSchedulerAndLateWebhookIsRecordedOnce() throws Exception {
        UUID voucher = redeem();
        UUID booking = UUID.fromString(result(post("/api/bookings").contentType("application/json").content(bookingBody(ROOM, 2, voucher)), USER, 200).path("id").asText());
        JsonNode payment = result(post("/api/bookings/" + booking + "/payments"), USER, 200);
        clock.set(clock.instant().plusSeconds(900));
        result(post("/api/bookings").contentType("application/json").content(bookingBody(ROOM, 2, null)), OTHER, 200);
        String payload = webhook(payment.path("paymentCode").asText(), 190000, 1002);
        assertEquals(409, signedWebhook(payload).getResponse().getStatus());
        assertEquals(409, signedWebhook(payload).getResponse().getStatus());
        assertEquals(1, jdbc.queryForObject("select count(*) from payment_anomalies", Integer.class));
        lifecycle.expire(booking);
        assertEquals("EXPIRED", jdbc.queryForObject("select cancellation_reason from bookings where id=?", String.class, booking));
        assertEquals("AVAILABLE", jdbc.queryForObject("select status from reward_vouchers where id=?", String.class, voucher));
    }

    @Test
    void signedUnknownTransfersDoNotExhaustTheConnectionPool() throws Exception {
        var replies = concurrent(20, () -> signedWebhook(webhook("invalid", 1000, 9001)));
        assertTrue(replies.stream().allMatch(r -> r.getResponse().getStatus() == 400));
        assertEquals(1, jdbc.queryForObject("select count(*) from payment_anomalies", Integer.class));
        result(get("/api/admin/payment-anomalies"), ADMIN, 200);
    }

    @Test
    void reusedProviderTransactionAcrossTwoBookingsCannotConfirmBoth() throws Exception {
        UUID first = UUID.fromString(result(post("/api/bookings").contentType("application/json").content(bookingBody(ROOM, 2, null)), USER, 200).path("id").asText());
        String secondBody = bookingBody(OTHER_ROOM, 2, null).replace(STAY.toString(), OTHER_STAY.toString());
        UUID second = UUID.fromString(result(post("/api/bookings").contentType("application/json").content(secondBody), OTHER, 200).path("id").asText());
        var a = result(post("/api/bookings/" + first + "/payments"), USER, 200);
        var b = result(post("/api/bookings/" + second + "/payments"), OTHER, 200);
        java.util.concurrent.atomic.AtomicInteger index = new java.util.concurrent.atomic.AtomicInteger();
        var responses = concurrent(2, () -> signedWebhook(webhook((index.getAndIncrement() == 0 ? a : b).path("paymentCode").asText(), 200000, 1003)));
        assertEquals(1, responses.stream().filter(r -> r.getResponse().getStatus() == 200).count());
        assertTrue(responses.stream().allMatch(r -> List.of(200, 409).contains(r.getResponse().getStatus())));
        assertEquals(1, jdbc.queryForObject("select count(*) from payments where status='success'", Integer.class));
        assertEquals(1, jdbc.queryForObject("select count(*) from bookings where status='confirmed'", Integer.class));
        assertEquals(1, jdbc.queryForObject("select count(*) from payment_anomalies", Integer.class));
    }

    @Test
    void bookingWaitingOnPartnerEditCannotUseUnapprovedRoom() throws Exception {
        CountDownLatch edited = new CountDownLatch(1);
        CountDownLatch commitEdit = new CountDownLatch(1);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Future<?> edit = executor.submit(() -> new org.springframework.transaction.support.TransactionTemplate(transactions)
                    .executeWithoutResult(status -> {
                        jdbc.queryForObject("select id from accommodations where id=? for update", UUID.class, STAY);
                        jdbc.queryForObject("select id from room where id=? for update", UUID.class, ROOM);
                        jdbc.update("update room set price=150000,version=version+1 where id=?", ROOM);
                        jdbc.update("update accommodations set status='pending',version=version+1 where id=?", STAY);
                        edited.countDown();
                        try { assertTrue(commitEdit.await(10, TimeUnit.SECONDS)); }
                        catch (InterruptedException ex) { Thread.currentThread().interrupt(); throw new IllegalStateException(ex); }
                    }));
            assertTrue(edited.await(10, TimeUnit.SECONDS));
            Future<MvcResult> booking = executor.submit(() -> mvc.perform(post("/api/bookings")
                    .header("Authorization", bearer(USER)).contentType("application/json")
                    .content(bookingBody(ROOM, 2, null))).andReturn());
            try {
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                boolean waiting = false;
                while (System.nanoTime() < deadline) {
                    waiting = Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from pg_stat_activity "
                            + "where datname=current_database() and pid<>pg_backend_pid() and wait_event_type='Lock')", Boolean.class));
                    if (waiting) break;
                    Thread.sleep(20);
                }
                assertTrue(waiting, "Booking must wait for the in-flight edit");
            } finally { commitEdit.countDown(); }
            edit.get(15, TimeUnit.SECONDS);
            assertEquals(404, booking.get(15, TimeUnit.SECONDS).getResponse().getStatus());
            assertEquals(0, jdbc.queryForObject("select count(*) from bookings", Integer.class));
        }
    }

    @Test
    void concurrentBookingsCannotReserveTheSameVoucherTwice() throws Exception {
        UUID voucher = redeem();
        java.util.concurrent.atomic.AtomicInteger index = new java.util.concurrent.atomic.AtomicInteger();
        var responses = concurrent(2, () -> {
            boolean first = index.getAndIncrement() == 0;
            String body = bookingBody(first ? ROOM : OTHER_ROOM, 2, voucher);
            if (!first) body = body.replace(STAY.toString(), OTHER_STAY.toString());
            return mvc.perform(post("/api/bookings").header("Authorization", bearer(USER)).contentType("application/json").content(body)).andReturn();
        });
        assertEquals(1, responses.stream().filter(r -> r.getResponse().getStatus() == 200).count());
        assertTrue(responses.stream().allMatch(r -> List.of(200, 400, 409).contains(r.getResponse().getStatus())));
        assertEquals(1, jdbc.queryForObject("select count(*) from bookings", Integer.class));
        assertEquals("RESERVED", jdbc.queryForObject("select status from reward_vouchers where id=?", String.class, voucher));
    }

    @Test
    void webhookRacingCancellationCannotLeavePaymentAndBookingInConflictingStates() throws Exception {
        UUID voucher = redeem();
        UUID booking = UUID.fromString(result(post("/api/bookings").contentType("application/json").content(bookingBody(ROOM, 2, voucher)), USER, 200).path("id").asText());
        var payment = result(post("/api/bookings/" + booking + "/payments"), USER, 200);
        java.util.concurrent.atomic.AtomicInteger index = new java.util.concurrent.atomic.AtomicInteger();
        var responses = concurrent(2, () -> index.getAndIncrement() == 0
                ? mvc.perform(post("/api/bookings/" + booking + "/cancel").header("Authorization", bearer(USER))).andReturn()
                : signedWebhook(webhook(payment.path("paymentCode").asText(), 190000, 1004)));
        assertTrue(responses.stream().allMatch(r -> List.of(200, 409).contains(r.getResponse().getStatus())));
        String state = jdbc.queryForObject("select status from bookings where id=?", String.class, booking);
        assertTrue(List.of("confirmed", "cancelled").contains(state));
        assertEquals(state.equals("confirmed") ? "success" : "pending", jdbc.queryForObject("select status from payments where booking_id=?", String.class, booking));
        assertEquals(state.equals("confirmed") ? "USED" : "AVAILABLE", jdbc.queryForObject("select status from reward_vouchers where id=?", String.class, voucher));
    }

    @Test
    void concurrentAdminChangesCannotDisableEveryAdministrator() throws Exception {
        jdbc.update("update users set role='admin' where id=?", OTHER);
        java.util.concurrent.atomic.AtomicInteger index = new java.util.concurrent.atomic.AtomicInteger();
        var responses = concurrent(2, () -> {
            boolean first = index.getAndIncrement() == 0;
            UUID actor = first ? ADMIN : OTHER, target = first ? OTHER : ADMIN;
            return mvc.perform(patch("/api/admin/users/" + target).header("Authorization", bearer(actor)).contentType("application/json")
                    .content("{\"role\":\"ADMIN\",\"enabled\":false,\"reason\":\"concurrent test\",\"version\":0}")).andReturn();
        });
        assertEquals(1, responses.stream().filter(r -> r.getResponse().getStatus() == 200).count());
        assertTrue(responses.stream().allMatch(r -> List.of(200, 401, 403).contains(r.getResponse().getStatus())));
        assertEquals(1, jdbc.queryForObject("select count(*) from users where role='admin' and enabled", Integer.class));
    }

    @Test
    void cacheCannotExposeUnpublishedStayAndRollbackDoesNotInvalidateCommittedData() throws Exception {
        result(get("/api/accommodations/" + STAY), null, 200);
        result(get("/api/accommodations/" + STAY), null, 200);
        result(post("/api/admin/accommodations/" + STAY + "/moderation").contentType("application/json")
                .content("{\"status\":\"INACTIVE\",\"reason\":\"test hide\",\"version\":0}"), ADMIN, 200);
        result(get("/api/accommodations/" + STAY), null, 404);
        result(post("/api/admin/accommodations/" + STAY + "/moderation").contentType("application/json")
                .content("{\"status\":\"ACTIVE\",\"reason\":\"test publish\",\"version\":1}"), ADMIN, 200);
        result(get("/api/accommodations/" + STAY), null, 200);
        long before = jdbc.queryForObject("select version from accommodations where id=?", Long.class, STAY);
        result(post("/api/admin/accommodations/" + STAY + "/moderation").contentType("application/json")
                .content("{\"status\":\"INACTIVE\",\"reason\":\"stale\",\"version\":0}"), ADMIN, 409);
        assertEquals(before, jdbc.queryForObject("select version from accommodations where id=?", Long.class, STAY));
        result(get("/api/accommodations/" + STAY), null, 200);
    }

    @Test
    void cacheHitAvoidsMetadataQueriesAndRolledBackChangeKeepsCommittedVersion() throws Exception {
        cacheManager.getCache("accommodation-detail").clear();
        var stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();
        result(get("/api/accommodations/" + STAY), null, 200);
        assertEquals(4, stats.getPrepareStatementCount());
        stats.clear();
        result(get("/api/accommodations/" + STAY), null, 200);
        assertEquals(1, stats.getPrepareStatementCount());
        assertThrows(IllegalStateException.class, () -> new org.springframework.transaction.support.TransactionTemplate(transactions).execute(status -> {
            var item = accommodations.findById(STAY).orElseThrow();
            item.setName("Uncommitted title"); accommodations.saveAndFlush(item);
            events.publishEvent(new io.github.hienpham0344.stayfinder.accommodation.service.AccommodationChanged(STAY));
            throw new IllegalStateException("Rollback fixture");
        }));
        stats.clear();
        assertEquals("Hà Nội Stay", result(get("/api/accommodations/" + STAY), null, 200).path("accommodation").path("name").asText());
        assertEquals(1, stats.getPrepareStatementCount());
    }

    @Test
    void cacheMissCannotMixApprovedPropertyWithConcurrentlyUnapprovedImages() throws Exception {
        cacheManager.getCache("accommodation-detail").clear();
        CountDownLatch readStarted = new CountDownLatch(1);
        CountDownLatch resumeRead = new CountDownLatch(1);
        var repositoryDelegate = org.mockito.Mockito.mockingDetails(images).getMockCreationSettings().getDefaultAnswer();
        org.mockito.Mockito.doAnswer(invocation -> {
            readStarted.countDown();
            assertTrue(resumeRead.await(10, TimeUnit.SECONDS));
            return repositoryDelegate.answer(invocation);
        }).when(images).findByAccommodationId(STAY);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Future<JsonNode> response = executor.submit(() -> result(get("/api/accommodations/" + STAY), null, 200));
            try {
                assertTrue(readStarted.await(10, TimeUnit.SECONDS));
                String body = "{\"name\":\"Pending Stay\",\"address\":\"Hà Nội\",\"typeId\":\"" + TYPE
                        + "\",\"basePrice\":100000,\"imageUrls\":[\"https://example.test/unapproved.jpg\"],\"featureIds\":[\"" + FEATURE + "\"],\"version\":0}";
                result(put("/api/partner/accommodations/" + STAY).contentType("application/json").content(body), PARTNER, 200);
            } finally { resumeRead.countDown(); }
            assertEquals("https://example.test/approved.jpg", response.get(15, TimeUnit.SECONDS).path("images").get(0).path("url").asText());
            result(get("/api/accommodations/" + STAY), null, 404);
        }
    }

    @Test
    void partnerEditingMetadataRequiresApprovalAndCannotChangeAnotherPartnersProperty() throws Exception {
        String body = "{\"name\":\"Changed Stay\",\"address\":\"Hà Nội\",\"description\":\"Updated\",\"typeId\":\"" + TYPE
                + "\",\"basePrice\":100000,\"imageUrls\":[\"https://example.test/photo.jpg\"],\"featureIds\":[\"" + FEATURE + "\"],\"version\":0}";
        result(put("/api/partner/accommodations/" + STAY).contentType("application/json").content(body), OTHER_PARTNER, 404);
        result(get("/api/accommodations/" + STAY), null, 200);
        JsonNode updated = result(put("/api/partner/accommodations/" + STAY).contentType("application/json").content(body), PARTNER, 200);
        assertEquals("PENDING", updated.path("accommodation").path("status").asText());
        result(get("/api/accommodations/" + STAY), null, 404);
        result(put("/api/partner/accommodations/" + STAY).contentType("application/json").content(body), PARTNER, 409);
        result(post("/api/admin/accommodations/" + STAY + "/moderation").contentType("application/json")
                .content("{\"status\":\"ACTIVE\",\"reason\":\"approved\",\"version\":1}"), ADMIN, 200);
        assertEquals("Changed Stay", result(get("/api/accommodations/" + STAY), null, 200).path("accommodation").path("name").asText());
    }

    @Test
    void partnerApplicationApprovalIsIdempotentAndInvalidatesOldToken() throws Exception {
        JsonNode application = result(post("/api/partner-applications").contentType("application/json")
                .content("{\"businessName\":\"Test partner\",\"description\":\"Small hotel\"}"), USER, 200);
        String path = "/api/admin/partner-applications/" + application.path("id").asText() + "/decision";
        String body = "{\"approved\":true,\"reason\":\"verified\",\"version\":0}";
        var replies = concurrent(3, () -> mvc.perform(post(path).header("Authorization", bearer(ADMIN))
                .contentType("application/json").content(body)).andReturn());
        assertTrue(replies.stream().allMatch(r -> r.getResponse().getStatus() == 200));
        result(get("/api/users/me"), USER, 401);
        assertEquals(1L, jdbc.queryForObject("select auth_version from users where id=?", Long.class, USER));
        assertEquals("partner", jdbc.queryForObject("select role from users where id=?", String.class, USER));
        result(get("/api/partner/accommodations"), OTHER, 403);
        result(get("/api/admin/users"), PARTNER, 403);
    }

    @Test
    void lastAdminProtectionAndSessionRevocationWorkThroughHttp() throws Exception {
        result(patch("/api/admin/users/" + ADMIN).contentType("application/json")
                .content("{\"role\":\"CUSTOMER\",\"enabled\":true,\"reason\":\"test\",\"version\":0}"), ADMIN, 403);
        result(patch("/api/admin/users/" + USER).contentType("application/json")
                .content("{\"role\":\"CUSTOMER\",\"enabled\":false,\"reason\":\"test\",\"version\":0}"), ADMIN, 200);
        result(get("/api/users/me"), USER, 401);
        result(post("/api/auth/logout"), OTHER, 200);
        result(get("/api/users/me"), OTHER, 401);
    }

    @Test
    void adminCatalogChangesAreVersionedAndAudited() throws Exception {
        String body = "{\"name\":\"New voucher\",\"pointsCost\":1000,\"discountAmount\":10000,\"minSpend\":100000,\"validityDays\":30,\"enabled\":true,\"version\":0}";
        result(post("/api/admin/reward-catalog").contentType("application/json").content(body), PARTNER, 403);
        JsonNode catalog = result(post("/api/admin/reward-catalog").contentType("application/json").content(body), ADMIN, 200);
        String path = "/api/admin/reward-catalog/" + catalog.path("id").asText();
        result(put(path).contentType("application/json").content(body.replace("true", "false")), ADMIN, 200);
        result(put(path).contentType("application/json").content(body), ADMIN, 409);
        result(post("/api/rewards/redeem").contentType("application/json").content("{\"catalogId\":\"" + catalog.path("id").asText()
                + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}"), USER, 400);
        assertEquals(2, jdbc.queryForObject("select count(*) from audit_logs where target_type='reward_catalog'", Integer.class));
    }

    @Test
    void localCredentialsAndPasswordRevocationWorkAgainstPersistedAccount() throws Exception {
        JsonNode account = result(post("/api/auth/register").contentType("application/json")
                .content("{\"fullName\":\"New Customer\",\"email\":\"new@example.test\",\"password\":\"test-password\"}"), null, 201);
        UUID userId = UUID.fromString(account.path("user").path("id").asText());
        assertEquals("CUSTOMER", account.path("user").path("role").asText());
        result(patch("/api/users/me").contentType("application/json").content("{\"fullName\":\"Updated Customer\",\"phone\":\"0900000000\"}"), userId, 200);
        result(put("/api/users/me/password").contentType("application/json")
                .content("{\"currentPassword\":\"test-password\",\"newPassword\":\"replacement-password\"}"), userId, 200);
        result(get("/api/users/me"), userId, 401);
        result(post("/api/auth/login").contentType("application/json").content("{\"email\":\"new@example.test\",\"password\":\"test-password\"}"), null, 401);
        result(post("/api/auth/login").contentType("application/json").content("{\"email\":\"NEW@example.test\",\"password\":\"replacement-password\"}"), null, 200);
    }

    @Test
    void bookingReadQueryCountIsBoundedAndRecommendationsAreStable() throws Exception {
        result(post("/api/bookings").contentType("application/json").content(bookingBody(ROOM, 2, null)), USER, 200);
        for (int i = 1; i <= 20; i++) {
            String body = bookingBody(ROOM, 2, null)
                    .replace("2027-01-02", LocalDate.of(2027, 1, 2).plusDays(i * 3L).toString())
                    .replace("2027-01-04", LocalDate.of(2027, 1, 4).plusDays(i * 3L).toString());
            result(post("/api/bookings").contentType("application/json").content(body), USER, 200);
        }
        var stats = emf.unwrap(SessionFactory.class).getStatistics(); stats.clear();
        assertEquals(1, result(get("/api/bookings").param("size", "1"), USER, 200).path("content").size());
        long singleCount = stats.getPrepareStatementCount();
        stats.clear();
        assertEquals(20, result(get("/api/bookings").param("size", "20"), USER, 200).path("content").size());
        // Includes one DB lookup by the JWT authentication filter.
        assertTrue(stats.getPrepareStatementCount() <= 6, "SQL count=" + stats.getPrepareStatementCount());
        assertTrue(stats.getPrepareStatementCount() <= singleCount, "SQL count must not grow with page size");
        JsonNode first = result(get("/api/recommendations").param("guests", "4"), USER, 200);
        assertEquals(first, result(get("/api/recommendations").param("guests", "4"), USER, 200));
        jdbc.update("update accommodations set status='inactive' where id=?", OTHER_STAY);
        assertEquals(1, result(get("/api/recommendations").param("guests", "4"), null, 200).size());
        stats.clear();
        result(get("/api/accommodations/" + STAY + "/rooms").param("checkIn", "2027-02-02").param("checkOut", "2027-02-04").param("guests", "4"), null, 200);
        assertTrue(stats.getPrepareStatementCount() <= 3, "Availability SQL count=" + stats.getPrepareStatementCount());
        long smallAvailabilityCount = stats.getPrepareStatementCount();
        for (int i = 0; i < 20; i++) {
            jdbc.update("insert into room(id,accommodation_id,room_type_id,name,price,status,capacity,created_at) "
                    + "values(?,?,?,'Extra',100000,'available',4,?)", UUID.randomUUID(), STAY, TYPE, java.sql.Timestamp.from(clock.instant()));
        }
        stats.clear();
        assertTrue(result(get("/api/accommodations/" + STAY + "/rooms").param("checkIn", "2027-02-02")
                .param("checkOut", "2027-02-04").param("guests", "4"), null, 200).size() >= 20);
        assertTrue(stats.getPrepareStatementCount() <= smallAvailabilityCount, "Availability SQL count must not grow with rooms");
    }

    @Test
    void managementStatisticsAreScopedAndDoNotMultiplyPaymentsByLegacyBookingLines() throws Exception {
        UUID first = UUID.fromString(result(post("/api/bookings").contentType("application/json")
                .content(bookingBody(ROOM, 2, null)), USER, 200).path("id").asText());
        String otherBody = bookingBody(OTHER_ROOM, 2, null).replace(STAY.toString(), OTHER_STAY.toString());
        UUID second = UUID.fromString(result(post("/api/bookings").contentType("application/json")
                .content(otherBody), OTHER, 200).path("id").asText());
        var firstPayment = result(post("/api/bookings/" + first + "/payments"), USER, 200);
        var secondPayment = result(post("/api/bookings/" + second + "/payments"), OTHER, 200);
        assertEquals(200, signedWebhook(webhook(firstPayment.path("paymentCode").asText(), 200000, 1009)).getResponse().getStatus());
        assertEquals(200, signedWebhook(webhook(secondPayment.path("paymentCode").asText(), 200000, 1010)).getResponse().getStatus());
        // Legacy bookings can have several lines; a scope join must count the booking/payment once.
        jdbc.update("insert into booking_details(id,booking_id,accommodation_snapshot_id,room_snapshot_id,check_in_date,"
                + "check_out_date,quantity,guests,subtotal) select ?,booking_id,accommodation_snapshot_id,room_snapshot_id,"
                + "check_in_date,check_out_date,quantity,guests,subtotal from booking_details where booking_id=?",
                UUID.randomUUID(), first);
        String later = bookingBody(ROOM, 2, null).replace("2027-01-02", "2027-02-02").replace("2027-01-04", "2027-02-04");
        UUID cancelled = UUID.fromString(result(post("/api/bookings").contentType("application/json").content(later), USER, 200).path("id").asText());
        result(post("/api/bookings/" + cancelled + "/cancel"), USER, 200);
        JsonNode own = result(get("/api/partner/statistics"), PARTNER, 200);
        assertEquals(2, own.path("totalBookings").asInt());
        assertEquals(1, own.path("cancelledBookings").asInt());
        assertEquals(0, own.path("pendingBookings").asInt());
        assertEquals(200000, own.path("receivedRevenue").asInt());
        JsonNode ownPayments = result(get("/api/partner/payments").param("size", "1"), PARTNER, 200);
        assertEquals(1, ownPayments.path("totalElements").asInt());
        assertEquals(first.toString(), ownPayments.path("content").get(0).path("bookingId").asText());
        result(get("/api/partner/payments/" + secondPayment.path("id").asText()), PARTNER, 404);
        JsonNode other = result(get("/api/partner/statistics"), OTHER_PARTNER, 200);
        assertEquals(1, other.path("totalBookings").asInt());
        assertEquals(200000, other.path("receivedRevenue").asInt());
        JsonNode global = result(get("/api/admin/statistics"), ADMIN, 200);
        assertEquals(3, global.path("totalBookings").asInt());
        assertEquals(400000, global.path("receivedRevenue").asInt());
        jdbc.update("update users set role='partner' where id=?", USER);
        JsonNode empty = result(get("/api/partner/statistics"), USER, 200);
        assertEquals(0, empty.path("totalBookings").asInt());
        assertEquals(0, empty.path("receivedRevenue").asInt());
    }

    @Test
    void everyManagementRouteEnforcesItsRoleThroughTheRealSecurityChain() throws Exception {
        int checked = 0;
        for (var mapping : routes.getHandlerMethods().keySet()) {
            for (String path : mapping.getPatternValues()) {
                if (!path.startsWith("/api/admin/") && !path.startsWith("/api/partner/")) continue;
                String concretePath = path.replaceAll("\\{[^}]+}", STAY.toString());
                for (var method : mapping.getMethodsCondition().getMethods()) {
                    var httpMethod = org.springframework.http.HttpMethod.valueOf(method.name());
                    result(request(httpMethod, concretePath), null, 401);
                    result(request(httpMethod, concretePath), USER, 403);
                    result(request(httpMethod, concretePath), path.startsWith("/api/admin/") ? PARTNER : ADMIN, 403);
                    checked++;
                }
            }
        }
        assertTrue(checked >= 30, "Must cover all registered management operations");
    }

    @Test
    void openApiCoversEveryApplicationRoute() throws Exception {
        JsonNode paths = json.readTree(java.nio.file.Files.readString(java.nio.file.Path.of("docs/openapi.yaml"))).path("paths");
        routes.getHandlerMethods().forEach((mapping, handler) -> {
            for (String path : mapping.getPatternValues()) {
                if (!path.startsWith("/api/")) continue;
                assertTrue(paths.has(path), "Undocumented route " + path);
                mapping.getMethodsCondition().getMethods().forEach(method ->
                        assertTrue(paths.path(path).has(method.name().toLowerCase()), "Undocumented method " + method + " " + path));
            }
        });
    }

    private UUID redeem() throws Exception {
        return UUID.fromString(result(post("/api/rewards/redeem").contentType("application/json")
                .content("{\"catalogId\":\"" + CATALOG + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}"), USER, 200).path("id").asText());
    }
    private String bookingBody(UUID room, int guests, UUID voucher) {
        return "{\"accommodationId\":\"" + STAY + "\",\"roomId\":\"" + room
                + "\",\"checkIn\":\"2027-01-02\",\"checkOut\":\"2027-01-04\",\"quantity\":1,\"guests\":" + guests
                + (voucher == null ? "" : ",\"voucherId\":\"" + voucher + "\"") + "}";
    }
    private String webhook(String code, long amount, long transaction) {
        return "{\"id\":" + transaction + ",\"code\":\"" + code + "\",\"transferAmount\":" + amount
                + ",\"accountNumber\":\"00000000\",\"transferType\":\"in\"}";
    }
    private MvcResult signedWebhook(String payload) throws Exception {
        String timestamp = Long.toString(clock.instant().getEpochSecond());
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-only-webhook-fixture".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = "sha256=" + HexFormat.of().formatHex(mac.doFinal((timestamp + "." + payload).getBytes(StandardCharsets.UTF_8)));
        return mvc.perform(post("/api/payments/webhook/sepay").contentType("application/json").content(payload)
                .header("X-SePay-Timestamp", timestamp).header("X-SePay-Signature", signature)).andReturn();
    }
    private JsonNode result(MockHttpServletRequestBuilder request, UUID user, int expected) throws Exception {
        if (user != null) request.header("Authorization", bearer(user));
        var response = mvc.perform(request).andReturn().getResponse();
        JsonNode body = json.readTree(response.getContentAsString());
        assertEquals(expected, response.getStatus(), "Response code=" + body.path("code").asText());
        return body.path("result");
    }
    private String bearer(UUID user) {
        UserRole role = user.equals(ADMIN) ? UserRole.ADMIN : user.equals(PARTNER) || user.equals(OTHER_PARTNER) ? UserRole.PARTNER : UserRole.CUSTOMER;
        return "Bearer " + jwt.generateToken(user, user + "@example.test", role, 0);
    }
    private static UUID id(int n) { return UUID.fromString(String.format("00000000-0000-0000-0000-%012d", n)); }
    private <T> List<T> concurrent(int size, Callable<T> work) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            CountDownLatch start = new CountDownLatch(1);
            List<Future<T>> futures = new ArrayList<>();
            for (int i = 0; i < size; i++) futures.add(executor.submit(() -> { start.await(); return work.call(); }));
            start.countDown();
            List<T> results = new ArrayList<>();
            for (var future : futures) results.add(future.get(30, TimeUnit.SECONDS));
            return results;
        }
    }
}
