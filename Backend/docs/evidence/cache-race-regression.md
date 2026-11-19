# Cache publication race regression

Regression: `BackendIntegrationTest#cacheMissCannotMixApprovedPropertyWithConcurrentlyUnapprovedImages`.

A latch pauses the public detail request after reading ACTIVE/version but before reading images. A partner update commits a new image and PENDING state, then the GET resumes. All operations use PostgreSQL and the actual Spring services/filter chain.

Before the fix, the observed test output was:

```
Tests run: 1, Failures: 1, Errors: 0, Skipped: 0
expected: <https://example.test/approved.jpg> but was: <https://example.test/unapproved.jpg>
```

Fix: `AccommodationServiceImpl.get` uses a REPEATABLE_READ read-only transaction, so the public eligibility check and cache-miss metadata queries read the same approved snapshot. Versioned cache keys and after-commit eviction remain enabled.

Post-fix: this regression and the full `verify` run passed; 137 tests, 0 failures, 0 errors, 0 skipped. See `tests.json`.
