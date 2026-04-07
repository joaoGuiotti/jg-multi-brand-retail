# Implementation Plan: Forgot Password — Email Recovery

**Branch**: `001-forgot-password-email` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-forgot-password-email/spec.md`

---

## Summary

Implement a two-step email-based password recovery flow:

1. **Forgot Password** — user submits email; system sends a one-time reset link (1-hour TTL)
   to the registered address, always returning a generic response to prevent enumeration.
2. **Reset Password** — user follows link; submits new password; system validates the token,
   updates credentials, revokes all active sessions, and redirects to login.

**Technical approach**: New `PasswordResetToken` DB table + bcrypt token hashing + SMTP email
via `@nestjs-modules/mailer` + frontend Standalone Component pages. Refresh-token revocation
implemented via a `tokenVersion` bump on `User`.

---

## Technical Context

**Language/Version**: TypeScript 5.7 (backend NestJS 11 + frontend Angular 17)
**Primary Dependencies**: NestJS, Prisma ORM, `@nestjs-modules/mailer` (NEW), `nodemailer` (NEW),
`handlebars` (NEW), `bcrypt` (existing), `eventemitter2` (existing for async dispatch),
Angular 17 Standalone Components, Reactive Forms
**Storage**: PostgreSQL 15 via Prisma — new `password_reset_tokens` table + `token_version` column
**Testing**: Jest (backend unit tests); no new E2E tests required for v1
**Target Platform**: Linux server (backend), SPA in browser (frontend)
**Project Type**: Web service (REST API) + Single-Page Application
**Performance Goals**: Request-to-response < 3 seconds (email sent async); token validation < 200ms
**Constraints**: Token TTL = 1 hour; rate limit = 1 token per email per 5 minutes; single-use tokens
**Scale/Scope**: Per-tenant, no cross-tenant token access; web only (mobile deep-links deferred)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| **I. Multi-Tenancy First** | `PasswordResetToken` stores `tenantId`; token lookup resolves tenant from user; cross-tenant use structurally impossible | ✅ PASS |
| **II. RBAC Everywhere** | Both new endpoints are explicitly unauthenticated (public routes) — no RBAC guard needed; backend guards NOT applied on these routes | ✅ PASS |
| **III. Type-Safety & Contract Integrity** | New DTOs added for `ForgotPasswordDto` and `ResetPasswordDto`; Prisma types used throughout; `any` not used | ✅ PASS |
| **IV. Observability & Structured Error Handling** | Token request + validation errors caught at use-case boundary; email dispatch failures logged; Redis not involved | ✅ PASS |
| **V. Simplicity & YAGNI** | `EventEmitter2` (already installed) used for async fire-and-forget instead of BullMQ queue; no extra abstraction layers introduced | ✅ PASS |

**Post-Design Re-check**: All gates pass. `tokenVersion` on `User` is a single DB column with
minimal JWT strategy change — justified by FR-010 (session revocation). Complexity justified.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-forgot-password-email/
├── plan.md              ← this file
├── research.md          ← Phase 0 complete
├── data-model.md        ← Phase 1 complete
├── quickstart.md        ← Phase 1 complete
├── contracts/
│   └── api.md           ← Phase 1 complete
└── tasks.md             ← Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
apps/backend/
├── prisma/
│   └── schema.prisma                         MODIFY — add PasswordResetToken model + tokenVersion on User
├── src/
│   ├── domain/
│   │   ├── entities/auth/
│   │   │   └── password-reset-token.entity.ts  NEW
│   │   └── repositories/
│   │       └── password-reset-token-repository.ts  NEW
│   ├── application/
│   │   └── use-cases/auth/
│   │       ├── forgot-password.use-case.ts     NEW
│   │       ├── forgot-password.use-case.spec.ts  NEW
│   │       ├── reset-password.use-case.ts      NEW
│   │       └── reset-password.use-case.spec.ts   NEW
│   └── infrastructure/
│       ├── dtos/auth/
│       │   ├── forgot-password.dto.ts          NEW
│       │   ├── reset-password.dto.ts           NEW
│       │   └── index.ts                        MODIFY — export new DTOs
│       ├── controllers/
│       │   └── auth.controller.ts              MODIFY — add 2 new routes
│       ├── modules/
│       │   └── auth.module.ts                  MODIFY — register mailer, new use-cases, new repository
│       ├── persistence/
│       │   ├── mappers/
│       │   │   └── password-reset-token.mapper.ts  NEW
│       │   └── repositories/
│       │       └── prisma-password-reset-token.repository.ts  NEW
│       ├── services/
│       │   └── mail/
│       │       ├── mail.service.ts             NEW
│       │       └── templates/
│       │           ├── reset-password.hbs      NEW (HTML email template)
│       │           └── reset-password.text.hbs NEW (plain-text fallback)
│       └── strategies/
│           └── jwt.strategy.ts                 MODIFY — add tokenVersion validation
│
apps/frontend/
└── src/app/
    ├── app.routes.ts                           MODIFY — add /forgot-password, /reset-password routes
    ├── core/
    │   └── services/
    │       └── auth.service.ts                 MODIFY — add forgotPassword() + resetPassword()
    └── features/
        └── auth/
            ├── forgot-password/
            │   ├── forgot-password.component.ts   NEW
            │   ├── forgot-password.component.html NEW
            │   └── forgot-password.component.scss NEW
            └── reset-password/
                ├── reset-password.component.ts    NEW
                ├── reset-password.component.html  NEW
                └── reset-password.component.scss  NEW
```

**Structure Decision**: Web application (Option 2). Both `apps/backend/` and `apps/frontend/`
receive changes. All backend changes go into the existing auth slice. All frontend changes
are new public pages under `features/auth/`.

---

## Phase 0: Research — COMPLETE ✅

See [research.md](./research.md). All decisions resolved:

- Email library: `@nestjs-modules/mailer` + `nodemailer` + `handlebars`
- Token design: `crypto.randomBytes(32)` hex + bcrypt hash storage
- Rate limiting: application-level (latest token `createdAt` check)
- Session revocation: `tokenVersion` on `User` embedded in JWT
- Frontend: two new public Standalone Component pages

---

## Phase 1: Design & Contracts — COMPLETE ✅

- [data-model.md](./data-model.md) — `PasswordResetToken` schema + `tokenVersion` on `User`
- [contracts/api.md](./contracts/api.md) — `POST /auth/forgot-password` + `POST /auth/reset-password`
- [quickstart.md](./quickstart.md) — Local validation steps for all flows

---

## Complexity Tracking

No Constitution Check violations. No complexity justification table needed.

One noteworthy design choice:

| Decision | Why | Alternative Rejected Because |
|---|---|---|
| `tokenVersion` on `User` for revocation | Zero-infra stateless JWT revocation | Token blacklist table — adds high write-load table; refresh token DB — major auth refactor |
| `EventEmitter2` for async email | Already installed; avoids BullMQ Redis dep | BullMQ — overkill for single email type; adds Redis config burden for this feature |
