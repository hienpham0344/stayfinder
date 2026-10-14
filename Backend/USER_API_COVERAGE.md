# USER API implementation coverage

This is an implementation map, not a claim that every endpoint was exercised in a deployed app. All 50 registry entries have controller/service implementations. USER screens consume production adapters; P05 is provider-facing, D01/D02 are ADMIN demo controls.

Controller paths expand under src/main/java/io/github/hienpham0344/stayfinder/; adapter paths under ../Frontend/services/. Test class names expand under src/test/java/io/github/hienpham0344/stayfinder/. Detailed contracts: [AUTH](AUTH.md), [CATALOG](CATALOG.md), [BOOKINGS](BOOKINGS.md), [REWARDS](REWARDS.md), [SEPAY](SEPAY.md), [MEDIA](MEDIA.md), [EXPERIENCE](EXPERIENCE.md). Local Superpowers specs/ledger are ignored and available only in this managed checkout.

| ID | Method/path (prefix /api) | Controller | Consumer | Verification sources |
|---|---|---|---|---|
| A01 | `POST /auth/register` | auth/controller/AuthController.java | authApi.ts | AuthServiceTest; AuthHttpBoundaryTest; ConcurrentTransactionsPostgresIntegrationTest |
| A02 | `POST /auth/login` | auth/controller/AuthController.java | authApi.ts | AuthServiceTest; AuthHttpBoundaryTest; ConcurrentTransactionsPostgresIntegrationTest |
| A03 | `POST /auth/refresh` | auth/controller/AuthController.java | authApi.ts | AuthServiceTest; AuthHttpBoundaryTest; ConcurrentTransactionsPostgresIntegrationTest |
| A04 | `POST /auth/logout` | auth/controller/AuthController.java | authApi.ts | AuthServiceTest; AuthHttpBoundaryTest; ConcurrentTransactionsPostgresIntegrationTest |
| A05 | `POST /auth/password` | auth/controller/AuthController.java | authApi.ts | AuthServiceTest; AuthHttpBoundaryTest; ConcurrentTransactionsPostgresIntegrationTest |
| A06 | `POST /auth/email-change` | auth/controller/AuthController.java | authApi.ts | AuthServiceTest; AuthHttpBoundaryTest; ConcurrentTransactionsPostgresIntegrationTest |
| U01 | `GET /users/me` | user/controller/UserController.java | profileApi.ts | UserProfilePatchTest; UserProfileRewardsProjectionTest; ExperiencePostgresIntegrationTest |
| U02 | `PATCH /users/me` | user/controller/UserController.java | profileApi.ts | UserProfilePatchTest; UserProfileRewardsProjectionTest; ExperiencePostgresIntegrationTest |
| U03 | `GET /users/me/preferences` | user/controller/UserPreferencesController.java | profileApi.ts | UserPreferencesTest; ExperiencePostgresIntegrationTest |
| U04 | `PATCH /users/me/preferences` | user/controller/UserPreferencesController.java | profileApi.ts | UserPreferencesTest; ExperiencePostgresIntegrationTest |
| U05 | `POST /support/reports` | support/controller/SupportReportController.java | profileApi.ts | SupportReportTest; ExperiencePostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| C01 | `GET /catalog/filters` | catalog/controller/CatalogMetadataController.java | catalogApi.ts | CatalogHttpBoundaryTest; CatalogPostgresIntegrationTest; PriceComparisonServiceTest |
| C02 | `GET /locations/suggestions?q=` | catalog/controller/CatalogMetadataController.java | catalogApi.ts | CatalogHttpBoundaryTest; CatalogPostgresIntegrationTest; PriceComparisonServiceTest |
| C03 | `GET /accommodations` | accommodation/controller/AccommodationController.java | catalogApi.ts | CatalogHttpBoundaryTest; CatalogPostgresIntegrationTest; PriceComparisonServiceTest |
| C04 | `GET /accommodations/{id}` | accommodation/controller/AccommodationController.java | catalogApi.ts | CatalogHttpBoundaryTest; CatalogPostgresIntegrationTest; PriceComparisonServiceTest |
| C05 | `GET /accommodations/{id}/rooms` | accommodation/controller/AccommodationController.java | catalogApi.ts | CatalogHttpBoundaryTest; CatalogPostgresIntegrationTest; PriceComparisonServiceTest |
| C06 | `GET /accommodations/{id}/price-comparisons` | accommodation/controller/AccommodationController.java | catalogApi.ts | CatalogHttpBoundaryTest; CatalogPostgresIntegrationTest; PriceComparisonServiceTest |
| F01 | `GET /favorites` | favorite/controller/FavoriteController.java | favoritesApi.ts | FavoriteServiceTest; ConcurrentTransactionsPostgresIntegrationTest |
| F02 | `PUT /favorites/{accommodationId}` | favorite/controller/FavoriteController.java | favoritesApi.ts | FavoriteServiceTest; ConcurrentTransactionsPostgresIntegrationTest |
| F03 | `DELETE /favorites/{accommodationId}` | favorite/controller/FavoriteController.java | favoritesApi.ts | FavoriteServiceTest; ConcurrentTransactionsPostgresIntegrationTest |
| B01 | `POST /booking-quotes` | booking/controller/BookingQuoteController.java | bookingApi.ts | BookingServiceTest; BookingLifecycleTest; BookingPaymentPostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| B02 | `POST /bookings` | booking/controller/BookingController.java | bookingApi.ts | BookingServiceTest; BookingLifecycleTest; BookingPaymentPostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| B03 | `GET /bookings` | booking/controller/BookingController.java | bookingApi.ts | BookingServiceTest; BookingLifecycleTest; BookingPaymentPostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| B04 | `GET /bookings/{id}` | booking/controller/BookingController.java | bookingApi.ts | BookingServiceTest; BookingLifecycleTest; BookingPaymentPostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| B05 | `GET /bookings/{id}/cancellation-preview` | booking/controller/BookingCancellationController.java | bookingApi.ts | BookingServiceTest; BookingLifecycleTest; BookingPaymentPostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| B06 | `POST /bookings/{id}/cancel` | booking/controller/BookingCancellationController.java | bookingApi.ts | BookingServiceTest; BookingLifecycleTest; BookingPaymentPostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| P01 | `GET /payment-methods` | payment/controller/PaymentMethodController.java | paymentApi.ts | PaymentServiceTest; SepayReceiptServiceTest; SepayReconciliationTest; AuthHttpBoundaryTest; UserApiHttpJourneyPostgresIntegrationTest |
| P02 | `POST /bookings/{id}/payments` | payment/controller/PaymentController.java | paymentApi.ts | PaymentServiceTest; SepayReceiptServiceTest; SepayReconciliationTest; AuthHttpBoundaryTest; UserApiHttpJourneyPostgresIntegrationTest |
| P03 | `GET /bookings/{id}/payments` | payment/controller/PaymentController.java | paymentApi.ts | PaymentServiceTest; SepayReceiptServiceTest; SepayReconciliationTest; AuthHttpBoundaryTest; UserApiHttpJourneyPostgresIntegrationTest |
| P04 | `GET /payments/{id}` | payment/controller/PaymentController.java | paymentApi.ts | PaymentServiceTest; SepayReceiptServiceTest; SepayReconciliationTest; AuthHttpBoundaryTest; UserApiHttpJourneyPostgresIntegrationTest |
| P05 | `POST /payments/webhook/sepay` | payment/controller/PaymentController.java | SePay provider webhook | PaymentServiceTest; SepayReceiptServiceTest; SepayReconciliationTest; AuthHttpBoundaryTest; UserApiHttpJourneyPostgresIntegrationTest |
| R01 | `GET /accommodations/{id}/reviews` | review/controller/ReviewController.java | reviewsApi.ts | ReviewServiceTest; ExperiencePostgresIntegrationTest; UserApiHttpJourneyPostgresIntegrationTest |
| R02 | `GET /accommodations/{id}/reviews/summary` | review/controller/ReviewController.java | reviewsApi.ts | ReviewServiceTest; ExperiencePostgresIntegrationTest; UserApiHttpJourneyPostgresIntegrationTest |
| R03 | `POST /accommodations/{id}/reviews` | review/controller/ReviewController.java | reviewsApi.ts | ReviewServiceTest; ExperiencePostgresIntegrationTest; UserApiHttpJourneyPostgresIntegrationTest |
| R04 | `PATCH /reviews/{id}` | review/controller/ReviewController.java | reviewsApi.ts | ReviewServiceTest; ExperiencePostgresIntegrationTest; UserApiHttpJourneyPostgresIntegrationTest |
| R05 | `DELETE /reviews/{id}` | review/controller/ReviewController.java | reviewsApi.ts | ReviewServiceTest; ExperiencePostgresIntegrationTest; UserApiHttpJourneyPostgresIntegrationTest |
| M01 | `POST /media` | media/controller/MediaController.java | mediaApi.ts | MediaFileValidationTest; MediaOwnershipTest; MediaUrlSignerTest; MediaCleanupTest; ExperiencePostgresIntegrationTest |
| M02 | `DELETE /media/{id}` | media/controller/MediaController.java | mediaApi.ts | MediaFileValidationTest; MediaOwnershipTest; MediaUrlSignerTest; MediaCleanupTest; ExperiencePostgresIntegrationTest |
| M03 | `GET /media/{id}/content` | media/controller/MediaController.java | mediaApi.ts | MediaFileValidationTest; MediaOwnershipTest; MediaUrlSignerTest; MediaCleanupTest; ExperiencePostgresIntegrationTest |
| W01 | `GET /rewards/wallet` | reward/controller/RewardController.java | rewardsApi.ts | RewardServiceTest; RewardClaimServiceTest; RewardReservationTest; ConcurrentTransactionsPostgresIntegrationTest |
| W02 | `GET /rewards/history` | reward/controller/RewardController.java | rewardsApi.ts | RewardServiceTest; RewardClaimServiceTest; RewardReservationTest; ConcurrentTransactionsPostgresIntegrationTest |
| W03 | `GET /rewards/catalog` | reward/controller/RewardController.java | rewardsApi.ts | RewardServiceTest; RewardClaimServiceTest; RewardReservationTest; ConcurrentTransactionsPostgresIntegrationTest |
| W04 | `POST /rewards/claims` | reward/controller/RewardController.java | rewardsApi.ts | RewardServiceTest; RewardClaimServiceTest; RewardReservationTest; ConcurrentTransactionsPostgresIntegrationTest |
| W05 | `GET /rewards/claims` | reward/controller/RewardController.java | rewardsApi.ts | RewardServiceTest; RewardClaimServiceTest; RewardReservationTest; ConcurrentTransactionsPostgresIntegrationTest |
| N01 | `GET /notifications` | notification/controller/NotificationController.java | notificationsApi.ts | NotificationServiceTest; ExperiencePostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| N02 | `GET /notifications/unread-count` | notification/controller/NotificationController.java | notificationsApi.ts | NotificationServiceTest; ExperiencePostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| N03 | `PATCH /notifications/{id}` | notification/controller/NotificationController.java | notificationsApi.ts | NotificationServiceTest; ExperiencePostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| N04 | `POST /notifications/read-all` | notification/controller/NotificationController.java | notificationsApi.ts | NotificationServiceTest; ExperiencePostgresIntegrationTest; ConcurrentTransactionsPostgresIntegrationTest |
| D01 | `POST /demo/bookings/{id}/settle` | demo/controller/DemoPaymentOperationsController.java | ADMIN operator only | DemoPaymentOperationsTest; CompletedStayRefundPostgresIntegrationTest; UserApiHttpJourneyPostgresIntegrationTest |
| D02 | `POST /demo/refunds/{id}/confirm` | demo/controller/DemoPaymentOperationsController.java | ADMIN operator only | DemoPaymentOperationsTest; CompletedStayRefundPostgresIntegrationTest; UserApiHttpJourneyPostgresIntegrationTest |

## Clarifications and remaining gates

- B03 supports status/page/size with createdAt/id descending. USER tabs are All/Pending/Confirmed/Completed/Cancelled; those screens have no date-filter control. The earlier generic date placeholder is not an implemented filter.
- P04 also supports /payments/{id}/status. N01 supplies the original server snapshotTime required by N04. U05 supports stable optional idempotency keys; the frontend support draft is memory-only, so reload deduplication is not promised.
- Language preferences format numbers/currency/dates; they do not translate the app.
- Migrations000–009 were approved/applied only to stayfinder_test_20261013. A [review-only demo seed](database/demo/README.md) is prepared but unapplied. Public rollout and persistent demo seed each require separate approval. No public deployment was performed.
- Real SePay Test Mode delivery (G3) is deferred by the user. Synthetic native/signed receipt tests verify implementation, not provider delivery.
- Native Android/iOS permission, keyboard, storage and layout checks remain unverified. Browser QA covers the exercised screens/states/widths only.
- Bank transfer is disabled without valid dedicated Test Mode configuration. Media needs its own signing key. ADMIN demo operations are disabled by default and do not perform real bank refunds.

## Reproducible checks

From Backend, default Maven test excludes postgres-tagged tests. Explicit full private-schema acceptance:

```powershell
.\mvnw.cmd '-Dspring.profiles.active=test' '-DexcludedGroups=' `
  '-Dstayfinder.test.schema=stayfinder_test_20261013' `
  '-Dstayfinder.test.approved=true' `
  '-Dstayfinder.test.envFile=C:/Users/HIEN/Documents/2.Project/stayfinder/Backend/.env' verify
```

The initializer refuses another schema. Cleanup removes only verified synthetic fixture identities, with no reset/public seed. The HTTP test invokes actual frontend adapters against loopback Spring and private PostgreSQL; a standalone unconfigured Node HTTP test is not acceptance.

From Frontend:

```powershell
$taskTests=@(rg --files -g '*.test.mjs' -g '!tests/userApiJourney.test.mjs')
node --test $taskTests
node node_modules/typescript/bin/tsc --noEmit
node node_modules/expo/bin/cli export --platform web --output-dir dist
```

The local execution ledger records commands/results, browser states, failures and review findings. These checks do not certify native platforms or actual provider delivery.

Mounted guest privacy regression (synthetic localhost only): run `node Frontend/tests/guestOwnerMountedFixture.cjs` from the repository root, open http://localhost:8191, enter a request for A, tap Continue, Sign out fixture, Sign in B fixture, then Resolve old quote. B must show B's profile with an empty special request, and the old quote must leave `No navigation`. This harness mounts the production guest component with the existing React/ReactDOM/TypeScript stack; it does not certify native navigation.
