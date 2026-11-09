# Administrative API

All routes below require ADMIN. Responses use ApiResponse; lists contain items, total, page and size (maximum 100). Account responses never include credentials. API is implemented and covered by offline tests; migration 011 must be applied to an explicitly approved PostgreSQL schema before database acceptance. No migration has been applied by this change.

| Method and path under /api/admin | Purpose |
| --- | --- |
| GET /users?page=0&size=20&role=partner&q=name | List/search accounts; role accepts customer, partner, admin |
| GET /users/{id} | Account details |
| PATCH /users/{id}/access | Body role, enabled, reason; change trusted local access |
| GET /reports | Paged support reports including descriptions |
| PATCH /reports/{id} | Body status IN_REVIEW, RESOLVED or DISMISSED and reason |
| GET /accommodations | Paged moderation inventory |
| GET /accommodations/{id} | Property details for moderation |
| PATCH /accommodations/{id}/moderation | Body decision APPROVE or HIDE and reason |
| GET /reviews | Paged visible and hidden reviews |
| PATCH /reviews/{id}/moderation | Body hidden boolean and reason |
| GET /settings | Read stored system metadata |
| PUT /settings/{key} | Body value and reason; SUPPORT_EMAIL or SUPPORT_RESPONSE_HOURS only |

Access changes serialize using a PostgreSQL transaction advisory lock, recheck the acting administrator, lock target rows, block self-disable/self-demotion and last-active-admin removal, then revoke local sessions and audit. Pending enrollment cannot be promoted to active through this route. Supabase identity remains separate; this API controls the application's trusted local roles and access. Unblocking requires a fresh valid sign-in because old local sessions remain revoked.

Report progression is submitted → in_review/resolved/dismissed, or in_review → resolved/dismissed. Repeating the same final status is harmless; reopening closed reports is rejected. Administrative reason and action are recorded transactionally in admin_audit_events.

Hiding an accommodation sets inactive and moderation_blocked. Partner edits cannot republish it until Admin approves. Hiding a review excludes it from public lists and rating summaries; signed media attached to hidden reviews is also denied. Owner edits preserve the hidden flag.

Settings are validated support metadata for clients, not a dynamic security configuration engine. SUPPORT_RESPONSE_HOURS is 1–168; SUPPORT_EMAIL must have email syntax. No secret, JWT policy or arbitrary configuration key can be written. Settings are initially empty until an administrator configures them; no external email is sent by this API.

Diagram mapping: ACT/SEQ-12 covers moderation; ACT/SEQ-13 covers user/partner administration. Report handling and settings are supplementary requirements, not new numbered sequence diagrams.

Required database verification once PostgreSQL is available: apply reviewed migration 011 after existing schema migrations; prove simultaneous last-admin edits cannot remove all active admins; verify role changes/disable revoke sessions; check report transitions persist; verify hidden review list/rating/media exclusion and Partner cannot republish a blocked property. Offline mocks cannot prove database locks or constraints.
