# API/session setup

Set EXPO_PUBLIC_API_BASE_URL to the backend base including /api, using .env.example as a template. For native devices, choose an address reachable from the device; localhost addresses the device itself. No device IP or credential is hardcoded in application code. HTTP is allowed only in development; production requires HTTPS.

Configure backend CORS_ALLOWED_ORIGINS with the exact web app origin and credentials support. For local browser HTTP only, explicitly set AUTH_LOCALHOST_INSECURE_COOKIE=true. The browser stores no refresh credential in JavaScript storage; the server owns the HttpOnly cookie.

The shared API client unwraps ApiResponse, bounds fetch and response-body reading, refreshes once, and blocks responses from an older user generation. Business POST/PATCH retries require their original idempotency key. Non-idempotent auth changes return AUTH_RETRY_REQUIRED after renewal so the user can submit again.

SessionCoordinator keeps access tokens in memory, serializes session mutations and native credential writes, and shares one refresh among concurrent requests. Native refresh credentials use expo-secure-store. A SecureStore device/runtime check and live two-user API exercise remain pending until the backend database is restored and reviewed migrations are deployed.

Node checks: node --test services/apiClient.test.mjs services/sessionCoordinator.test.mjs services/authValidation.test.mjs and the existing utility tests. Typecheck: node node_modules/typescript/bin/tsc --noEmit. Web export: node node_modules/expo/bin/cli export --platform web.
