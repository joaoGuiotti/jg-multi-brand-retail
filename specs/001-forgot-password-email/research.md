# Research: Forgot Password — Email Recovery

**Feature**: 001-forgot-password-email
**Created**: 2026-04-06
**Phase**: 0 — Pre-Design Research

---

## 1. Email Sending Infrastructure

**Decision**: Use `@nestjs-modules/mailer` with `nodemailer` adapter.

**Rationale**:
- Native NestJS module with template support and SMTP/SES adapters.
- Integrates cleanly as an injectable `MailerService`.
- The project already has `eventemitter2` installed, which can be used to decouple
  the email dispatch from the HTTP response (fire-and-forget event emission).

**Alternatives considered**:
- `BullMQ` queue (mentioned in README, not installed) — adds Redis dependency
  overhead for a single feature; deferred to later if volume warrants it.
- Raw `nodemailer` — more boilerplate, no DI integration; rejected.
- `@sendgrid/mail` / `AWS SES SDK` directly — vendor-locked, SMTP not configurable
  from env. Rejected in favour of `nodemailer` adapter which supports all transports.

**Resolution**: Install `@nestjs-modules/mailer` + `nodemailer` + `handlebars` (template engine).
Email dispatch fired via `EventEmitter2` (already installed) so the HTTP response
returns immediately without blocking on SMTP round-trips.

---

## 2. Reset Token Design

**Decision**: `crypto.randomBytes(32).toString('hex')` (64-char hex string) stored
as its **bcrypt hash** in a new `PasswordResetToken` table. Plain token delivered
in the URL query param `?token=<plain>`.

**Rationale**:
- Cryptographically random — not guessable.
- Storing hash (not plain) means a DB breach does not expose valid reset links.
- `bcrypt.compare(plainToken, storedHash)` is used to validate on reset.

**Alternatives considered**:
- Signed JWT as reset token — stateless, but cannot be invalidated before expiry.
  Rejected due to FR-011 (used-link rejection).
- UUID v4 token — less entropy than 32-byte random; rejected.

---

## 3. Rate Limiting (5-minute window)

**Decision**: Application-level rate limit checked in the use-case by querying the
latest token record for the given email. If `createdAt > now - 5min` and the token
is not yet expired/used, refuse to create a new one.

**Rationale**:
- Simple, no extra middleware or Redis needed.
- Consistent with existing auth pattern (no rate-limit middleware in place).

**Alternatives considered**:
- NestJS `ThrottlerModule` — request-level, not email-level. Rejected for this use-case.
- Redis-backed counter — overkill for a 5-minute window. Rejected.

---

## 4. Refresh Token Revocation on Password Reset

**Decision**: Add a `tokenVersion: Int @default(1)` field to the `User` model.
On password reset success, increment `tokenVersion`. Embed `tokenVersion` in the
JWT payload. The `JwtStrategy` validates that the decoded `tokenVersion` matches
the stored one; mismatch = invalid token → 401.

**Rationale**:
- The current JWT implementation is fully stateless — there is no refresh-token
  revocation store, no DB-backed token list.
- Adding `tokenVersion` is the lightest change that achieves per-user global
  revocation without a token blacklist table.
- Only one column addition; the JWT strategy change is minimal (one extra DB read
  in `validate()`).

**Alternatives considered**:
- Token blacklist table — full generality but heavy write load. Deferred.
- Store refresh tokens in DB — full revocation control but major refactor. Deferred.

**Note for Constitution Check**: This adds a DB column to `User`, requiring a new
Prisma migration (FR-010 from spec). Acceptable per constitution governance.

---

## 5. Frontend Page Structure

**Decision**: Two new public Standalone Component pages following the existing
`login` pattern:
- `forgot-password/` — email entry form.
- `reset-password/` — new password + confirm form; reads `?token=` + `?email=` from URL.

Both are `loadComponent` lazy routes added to `app.routes.ts` at the same level as
`/login` and `/register`.
The `AuthService` gains two new methods: `forgotPassword(email)` and
`resetPassword(token, email, newPassword)`.

**Alternatives considered**:
- A single page with conditional views — harder to link directly from email. Rejected.
- Modal/dialog overlay on login — poor UX for email link flow. Rejected.

---

## 6. Tenant Scoping of Reset Tokens

**Decision**: The email address in `User` is `@unique` globally (see schema line 48),
so a single email lookup uniquely identifies the tenant. The `PasswordResetToken`
stores `tenantId` taken from the found user record.

No `tenantId` param in the reset URL is needed — the token lookup resolves the
tenant from the stored record. Cross-tenant token usage is structurally impossible
because each token is bound to a `(userId, tenantId)` pair.

---

## 7. Email Template

**Decision**: HTML + plain-text email with Handlebars template.
Variables: `{{ userName }}`, `{{ tenantName }}`, `{{ tenantLogoUrl }}`, `{{ resetUrl }}`,
`{{ expiryMinutes }}`.

The `resetUrl` pattern: `https://<frontend-url>/reset-password?token=<plain>&email=<email>`.
`email` is included in the URL so the reset form can pre-fill the field and send it
to the API without requiring the user to re-enter it.

---

## Summary of New Dependencies

| Package | Purpose |
|---|---|
| `@nestjs-modules/mailer` | NestJS mailer module |
| `nodemailer` | SMTP transport |
| `handlebars` | Email template engine |
| `@types/nodemailer` | TypeScript types (dev) |

No new frontend dependencies required.
