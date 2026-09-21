# StayFinder Agent Guide

## Project Context

StayFinder is a travel/accommodation app with:

- `Frontend/`: Expo React Native + TypeScript mobile app.
- `Backend/`: Java 21 + Spring Boot API.
- Database target: PostgreSQL/Supabase.
- Payment target: SePay sandbox for the academic demo.

Core user flows: search stays, compare prices, view stay details, save wishlist items, book rooms, pay online, rate/comment, and receive suggestions. Main roles are `USER`, `PARTNER`, and `ADMIN`.

## Working Rules

- Read nearby code and this file before planning implementation.
- Keep changes scoped to the request. Do not refactor unrelated code.
- Prefer existing project patterns over new abstractions.
- Do not add dependencies without explaining why existing stack is insufficient and waiting for explicit user approval.
- Do not scrape websites, bypass rate limits, bypass CAPTCHA, or circumvent access controls. Use official APIs or mock data.
- Never commit secrets, tokens, `.env` files, payment credentials, or private keys.
- For destructive operations, verify the exact target path first.

## Workflow Modes

Default mode is `interactive`.

- `interactive`: use for new features, backend/auth/payment work, booking flows, API contracts, or anything that changes architecture. Scout, present a short design/plan, wait for approval, implement, test, review.
- `fast`: use only for small, clear fixes. Still inspect first, make the smallest change, run focused checks, and review the diff.
- `auto`: continue without pausing only when the user explicitly asks for auto/trust-me behavior. Still stop for destructive actions, new dependencies, payment/security changes, schema-breaking API changes, or reviewer Critical findings.
- `no-test`: only when the user explicitly says to skip tests.

## Subagent Roles

Use project-local custom agents from `.codex/agents/` when the work benefits from isolation:

- `scout`: read-only codebase exploration.
- `planner`: design/plan writer, no implementation.
- `frontend_implementer`: Expo/React Native implementation.
- `backend_implementer`: Spring Boot implementation.
- `tester`: focused verification and test-gap analysis.
- `reviewer`: adversarial code review.
- `debugger`: root-cause analysis before fixes.
- `ui_ux_reviewer`: mobile UX/design consistency review.
- `docs_manager`: project documentation updates.

Do not spawn parallel write agents for the same file or shared config. Parallel agents are best for scouting, testing, review, and independent file ownership.

## Local Skills

Project-local Claude-Kit `.agents` skills are enabled from `.codex/skills/`.
When an imported skill mentions a Claude-Kit command such as `/ck:scout`, `/ck:debug`, `/ck:test`, or `/ck:code-review`, treat it as the corresponding local Codex skill name: `claudekit-scout`, `claudekit-debug`, `claudekit-test`, or `claudekit-code-review`.

## Backend Rules

Layering:

```text
Controller -> Service -> Repository -> Database
```

- Controllers handle HTTP, DTO validation, auth boundaries, and response mapping. They must not contain business logic or query repositories directly.
- Services own business logic, business validation, transactions, and coordination.
- Repositories own persistence only.
- Public API responses should use `ApiResponse<T>` style wrappers.
- Do not expose JPA entities directly from public APIs.
- Use DTOs for requests/responses and MapStruct for entity/DTO mapping when the project has matching DTOs.
- Use centralized exception handling with specific error codes; do not leak stack traces or internal errors to clients.
- JWT auth should be enforced through Spring Security/RBAC, not ad hoc role string checks in controllers.

Payment-specific rules:

- Keep SePay logic behind a provider abstraction.
- Verify webhook authenticity when provider data is available.
- Make webhook/payment updates idempotent.
- Track payments separately from bookings enough to preserve status/history.

## Frontend Rules

- Keep screens/pages, reusable components, services/API calls, state, types, and utilities separated.
- Do not scatter duplicate API calls across UI components.
- Components should not contain large business logic.
- Follow existing Expo Router patterns.
- Respect mobile constraints: safe areas, touch targets, loading states, error states, empty states, offline/network failures.
- Prefer consistent design tokens over one-off colors/sizes.
- For Vietnamese text, ensure font choice supports Vietnamese diacritics.

## Verification

Use focused checks first, then broaden when public/shared behavior changed.

- Frontend: typecheck/lint/build/export when available and relevant.
- Backend: Maven tests/build from `Backend/` when backend code changes.
- Booking/payment/auth changes require at least one test or clearly documented manual verification path.
- Before saying work is complete, report exactly what was run and what failed or could not run.

## Code Review Rules

Prioritize real defects over style:

- correctness regressions,
- missing validation,
- auth/authz gaps,
- payment idempotency or webhook trust issues,
- booking price/state mismatches,
- unhandled async/network failures,
- tests that do not assert meaningful behavior,
- scope creep or duplicate abstractions.

Review findings must cite concrete files/lines when possible.
