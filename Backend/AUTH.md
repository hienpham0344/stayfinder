# Spring-owned authentication

Supabase hosts PostgreSQL only. Spring Security verifies BCrypt passwords and builds a principal from the current application user and session. JWT access tokens expire after 15 minutes and identify a user/session; token role claims do not grant roles.

Set JWT_SECRET_BASE64 to at least 32 random decoded bytes. Configure CORS_ALLOWED_ORIGINS with exact browser origins. AUTH_LOCALHOST_INSECURE_COOKIE=true permits HTTP cookies only for an explicitly allowed localhost origin during development; cookies for other origins remain Secure.

All auth mutations require X-Client-Platform. Web requests require an allowed Origin and credentials:include; the refresh credential is an HttpOnly, SameSite=Lax cookie under /api/auth and is omitted from JSON. Native requests must omit Origin/cookies and return/send refresh credentials explicitly. Native storage uses the approved Expo SecureStore module. Auth entry requests omit access Bearer headers.

Refresh families have a fixed 30-day lifetime. Rotation locks the family before its token version. Consumed-token reuse within 10 seconds returns REFRESH_RETRY; later reuse revokes the family, including its access tokens. The replay exception explicitly commits that revocation. Password/email changes verify the current password, revoke all user sessions and append an audit event.

The in-memory attempt limiter is bounded and suitable for the single-instance academic demo. Distributed deployments require a shared limiter. Registration/email changes do not verify email ownership; SMTP/recovery is outside the approved UI scope. Existing profiles require operator-controlled Spring credential enrollment; no public enrollment endpoint or default password is provided.

The database connection was restored and inspected read-only on 2026-10-13; deployment remains gated by exact SQL/target review. public.users contains 0 rows, normalized duplicate email groups are 0, and users_id_fkey still references auth.users(id). Required mappings include users.password_hash/credential_state and auth_sessions, refresh_tokens, auth_audit_events. Existing UUIDs must be preserved, the exact users-to-auth.users FK reviewed, and normalized duplicate emails resolved before adding the unique expression index. No migration has been applied. Unit/MVC tests mock persistence and do not prove PostgreSQL locking, constraints or deployment readiness.
