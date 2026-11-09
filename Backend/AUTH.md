# Authentication modes

## Supabase Auth integration

Set `STAYFINDER_AUTH_MODE=supabase`, `STAYFINDER_AUTH_SUPABASE_URL=https://<project>.supabase.co`,
and `STAYFINDER_AUTH_SUPABASE_PUBLISHABLE_KEY=<publishable or anon key>` in the deployment environment.
Never configure a service-role key here. This mode needs no local JWT signing secret. The existing
`spring` mode remains the default for backwards-compatible deployments and offline legacy tests.
Select one mode for an environment; tokens from the other issuer are not accepted.

Spring verifies RS256/ES256 JWT signatures using the configured project's JWKS, exact issuer,
`authenticated` audience, expiry, issuance time, UUID subject and session ID. Configure an
asymmetric signing key in Supabase; legacy HS256 project tokens are deliberately not accepted.
The JWKS fetch is lazy, so an unavailable Supabase endpoint does not block bean creation.
Authentication still fails closed while keys/auth endpoints cannot be reached. PostgreSQL remains
required to run the API even though unit tests can run offline.

The application `users.id` equals the verified Supabase `sub`. New identities provision only
CUSTOMER; a claimed role in `user_metadata` or `app_metadata` never grants application roles.
Existing accounts must be migrated explicitly by UUID, never silently linked by matching email.
An email collision returns a conflict. Disabled/pending local identities are never reactivated
by sign-in. Admin manages roles through trusted local records; Supabase users need no local
password hash. Existing migration 001 permits a null password hash; no extra auth DDL is needed.

The API facade preserves `/api/auth/login`, `/register`, `/refresh`, `/logout`, `/password`, and
`/email-change`. Login/registration/refresh use Supabase Auth REST and adopt the verified session
into local `auth_sessions`; the existing origin checks, HttpOnly web refresh cookie and native
token contract remain in force. A directly obtained SDK JWT must first be adopted through the
API login/refresh facade; an unknown local session is rejected. Sessions have a local 30-day
maximum lifetime and revocation is checked on every protected call. Refresh cannot revive a
revoked session. Login is required again after the local lifetime expires.
Credential changes also persist a cutoff in `auth_audit_events`. A token issued before that cutoff
cannot be adopted by a concurrent or delayed sign-in, even when its Supabase signature is still
valid. Tokens issued in the same second as the change may require another sign-in a second later.

With Confirm Email enabled, registration returns **202 with null data**, not a fake login session;
the web refresh cookie is cleared. The client must display a confirmation message, complete the
Supabase email confirmation, then sign in. With confirmation disabled in a dedicated demo project,
registration can return the normal 201 session. The frontend must handle the 202 response before
using this mode. Configure Supabase Site URL and allowed redirects for the chosen frontend.

Password recovery adds:

- `POST /api/auth/forgot-password` with `{ "email": "person@example.com" }`. It returns the same
  successful response for an unknown account. Provider outage/rate-limit remain 503/429; no
  delivery success is claimed while Supabase is unavailable.
- `POST /api/auth/reset-password` with `{ "tokenHash": "<one-time recovery proof>", "password": "<new password>" }`.
  Configure the Supabase recovery email template to deliver `{{ .TokenHash }}` to the approved
  frontend reset page. The server exchanges that proof with `/verify` and `type=recovery`, updates
  the password, revokes local sessions and requests global Supabase logout. A regular access token
  cannot replace the one-time proof. Password input is 12–128 characters; Supabase password policy
  can impose additional requirements. Successful reset does not automatically sign the user in.

Both endpoints require the existing X-Client-Platform and web Origin boundary, have bounded input,
use the attempt limiter and return `Cache-Control: no-store`. No access/refresh token or recovery
proof is logged. Configure Supabase SMTP/email policy before testing actual delivery. These routes
do not exist in legacy Spring mode. Password/email changes in Supabase mode reauthenticate with
the current password, verify the same subject, then revoke sessions. A changed email is copied to
the local profile only when a subsequent verified session carries the confirmed email.

External credential changes made directly through Supabase bypass the facade's local revocation;
already-issued JWTs can remain usable until their expiry, as in Supabase's standard JWT contract.
Use short access-token lifetimes and the facade for app credential changes. Admin disabling a
local account denies access immediately regardless of provider token lifetime.

Offline validation includes real RSA signatures with invalid issuer/audience/expiry/signing-key
cases, client-metadata role escalation rejection, disabled/revoked session rejection, and recovery
proof/revocation behavior. These checks do not certify live JWKS rotation, PostgreSQL provisioning,
email delivery, CAPTCHA-enabled projects or the device/browser UX. No migration or data seed was
applied as part of this implementation.

References: https://supabase.com/docs/guides/auth/jwts,
https://supabase.com/docs/guides/auth/passwords,
https://github.com/supabase/auth/blob/master/openapi.yaml.

## Legacy Spring-owned authentication

Supabase hosts PostgreSQL only. Spring Security verifies BCrypt passwords and builds a principal from the current application user and session. JWT access tokens expire after 15 minutes and identify a user/session; token role claims do not grant roles.

Set JWT_SECRET_BASE64 to at least 32 random decoded bytes. Configure CORS_ALLOWED_ORIGINS with exact browser origins. AUTH_LOCALHOST_INSECURE_COOKIE=true permits HTTP cookies only for an explicitly allowed localhost origin during development; cookies for other origins remain Secure.

All auth mutations require X-Client-Platform. Web requests require an allowed Origin and credentials:include; the refresh credential is an HttpOnly, SameSite=Lax cookie under /api/auth and is omitted from JSON. Native requests must omit Origin/cookies and return/send refresh credentials explicitly. Native storage uses the approved Expo SecureStore module. Auth entry requests omit access Bearer headers.

Refresh families have a fixed 30-day lifetime. Rotation locks the family before its token version. Consumed-token reuse within 10 seconds returns REFRESH_RETRY; later reuse revokes the family, including its access tokens. The replay exception explicitly commits that revocation. Password/email changes verify the current password, revoke all user sessions and append an audit event.

The in-memory attempt limiter atomically reserves per-email and per-IP capacity before authentication, includes in-flight requests in its limits (5 email/20 IP per15minutes), and releases capacity on success or non-credential errors. It is bounded for the single-instance academic demo. Distributed deployments require a shared limiter. Registration/email changes do not verify email ownership; SMTP/recovery is outside the approved UI scope. Existing profiles require operator-controlled Spring credential enrollment; no public enrollment endpoint or default password is provided.

The database connection was restored and inspected read-only on 2026-10-13; deployment remains gated by exact SQL/target review. public.users contains 0 rows, normalized duplicate email groups are 0, and users_id_fkey still references auth.users(id). Required mappings include users.password_hash/credential_state and auth_sessions, refresh_tokens, auth_audit_events. Existing UUIDs must be preserved, the exact users-to-auth.users FK reviewed, and normalized duplicate emails resolved before adding the unique expression index. Migrations000–009 have since been separately approved/applied only to stayfinder_test_20261013; public remains unchanged. Unit/MVC tests alone do not prove PostgreSQL locking/constraints; the approved private-schema concurrency and HTTP acceptance provide separate evidence. Public rollout is still gated.

PostgreSQL concurrency regression evidence (2026-10-13): forced real backend row waits exposed stale JPA first-level state in refresh rotation and login/password changes. AuthService now refreshes locked user/session/token entities before credential/consumed-state checks. One concurrent refresh rotates and the other returns REFRESH_RETRY; replay beyond10seconds commits family revocation, and the replacement becomes SESSION_REVOKED. A login waiting across a committed password change cannot authenticate the old password. Access token validation requires iat/nbf/exp, rejects future issuance and lifetimes over15minutes. Token/password values are never emitted by these tests.
