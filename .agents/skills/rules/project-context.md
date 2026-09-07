# Project Context

## 1. Project Overview

This project is a travel application that integrates accommodation search and price comparison.

The system allows users to:

- Search accommodations
- Compare accommodation prices
- View accommodation details
- View accommodation locations
- Save accommodations
- Book accommodations
- Make online payments
- Rate accommodations
- Comment on accommodations
- Receive accommodation suggestions

---

## 2. Main Actors

The system contains three main roles:

### User

Users can:

- Register
- Login
- Search accommodations
- View accommodation details
- Compare prices
- Save accommodations
- Book accommodations
- Make payments
- Rate accommodations
- Comment
- Manage their profile

### Partner

Partners can:

- Manage accommodation information
- Manage room information
- Manage prices
- Manage availability
- View bookings
- Manage accommodation-related information

### Admin

Administrators can:

- Manage users
- Manage partners
- Manage accommodations
- Manage system data
- Manage reports
- Manage platform configuration

---

## 3. Technology Stack

### Mobile

- React Native
- Expo
- TypeScript

### Backend

- Java
- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- Jakarta Validation
- Maven

### Database

- PostgreSQL
- Supabase

### API

- REST
- JSON
- OpenAPI

### Development Tools

- IntelliJ IDEA
- Visual Studio Code
- Android Studio
- Postman
- Git
- GitHub

---

## 4. Architecture

The system follows a client-server architecture.

```
Mobile Application
        |
        | REST API
        ↓
Spring Boot Backend
        ↓
PostgreSQL / Supabase
```

The backend may communicate with external accommodation APIs.

```
External APIs
        ↑
Spring Boot Backend
```

The mobile application should NOT directly depend on third-party accommodation APIs unless explicitly required.

---

## 5. Price Comparison & External Data Integration

The price comparison system may aggregate data from multiple sources.

Potential sources include:

- Internal partner data
- Third-party accommodation APIs
- Mock data for development/testing

External data must be normalized into the project's internal model before being returned to the mobile application. The frontend must not need to understand every external provider's response format.

External accommodation providers should be hidden behind a common internal interface.

Example concept:

AccommodationProvider


Possible implementations:

- InternalProvider
- ProviderA
- ProviderB
- MockProvider

The business layer should depend on the abstraction rather than directly depending on a specific provider.

---

## 6. Authentication & Authorization

The system uses **JWT (JSON Web Token)** for authentication.

### Flow

- User/Partner logs in with credentials → backend validates → issues an **Access Token** (short-lived) and optionally a **Refresh Token** (longer-lived).
- Client attaches the Access Token in the `Authorization: Bearer <token>` header for all protected endpoints.
- Spring Security filters validate the token on each request before reaching the Controller.

### Authorization

- Role-based access control (RBAC) using the three roles: `USER`, `PARTNER`, `ADMIN`.
- Role must be embedded in the JWT claims (e.g. `role` claim) and verified via Spring Security (`@PreAuthorize`, `SecurityFilterChain` config) — do not check roles manually inside Controllers/Services with if-else on strings.
- Each endpoint should be explicitly restricted to the roles allowed to access it (e.g. `/api/v1/partner/**` → `PARTNER` only, `/api/v1/admin/**` → `ADMIN` only).

### Simplifications acceptable for this academic project

- A single Access Token without a Refresh Token flow is acceptable to reduce complexity (re-login when expired).
- Token expiration can be relatively long (e.g. a few hours) for easier testing/demo.

### Notes to make this more production-ready (future improvement, not required now)

- Add a **Refresh Token** mechanism with rotation to avoid forcing re-login and to reduce the blast radius of a leaked access token.
- Store refresh tokens (or a token blacklist for logout/revocation) server-side — plain JWT has no built-in revocation.
- Use short-lived access tokens (e.g. 15 minutes) in production instead of long-lived ones.
- Never store JWT in plain unprotected storage on mobile — use secure storage (e.g. `expo-secure-store`) on React Native.
- Add rate limiting on the login endpoint to mitigate brute-force attacks.
- Consider password policies (min length, hashing with BCrypt/Argon2 — do not store plain text passwords under any circumstance, even for a school project).

---

## 7. Payment

Payments are processed via a **third-party payment API — SePay (sandbox environment)**, since this is an academic project and does not require a production-grade payment gateway.

### Flow (simplified)

- Backend generates a payment request (e.g. via QR code / bank transfer info from SePay sandbox) tied to a `Booking`.
- SePay sends a **webhook** to the backend when a transaction occurs.
- Backend verifies the webhook and updates the corresponding `Booking`/`Payment` status (e.g. `PENDING` → `PAID` / `FAILED`).
- The mobile app polls or receives a status update to confirm payment result to the user.

### Architecture notes

- Keep payment logic behind an abstraction (e.g. `PaymentProvider` interface), similar to the `AccommodationProvider` pattern in Section 5 — this keeps the door open to swapping/adding providers (Momo, VNPay, Stripe...) later without touching business logic elsewhere.
- Payment state should be tracked in its own `Payment` entity/table (status, amount, provider transaction ref, timestamps) — not conflated directly with `Booking` status as a single field, so history/audit is preserved.

### Simplifications acceptable for this academic project

- Sandbox/test transactions only — no real money involved.
- A simplified webhook handler without heavy retry/queue infrastructure is acceptable.
- Manual or simple polling instead of push notifications for payment status is acceptable.

### Notes to make this more production-ready (future improvement, not required now)

- **Verify webhook authenticity** (signature/secret check from SePay) — never trust an incoming webhook call without validation, even in sandbox, to build the right habit.
- Make payment status updates **idempotent** — a webhook may be sent more than once; processing the same transaction twice must not double-credit a booking.
- Handle **partial failures**: what happens if payment succeeds but the booking confirmation step fails afterward (or vice versa) — needs a reconciliation strategy.
- Add a timeout/expiration for pending payments (e.g. auto-cancel a booking if unpaid after N minutes) to avoid holding inventory indefinitely.
- Log all payment transactions for audit purposes (do not log sensitive data like full card numbers if ever applicable).
- If expanding beyond sandbox: comply with relevant payment/PCI considerations before handling real transactions.

---

## 8. Non-Commercial / Academic Context

The project may use mock data when external APIs are unavailable.

Do not scrape websites or bypass anti-bot mechanisms.

Do not implement mechanisms designed to circumvent:

- CAPTCHA
- Rate limits
- Anti-bot systems
- Authentication restrictions
- Access controls

Use officially available APIs or permitted data sources.