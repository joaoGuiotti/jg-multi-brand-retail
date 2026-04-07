---
description: "Task list for 001-forgot-password-email implementation"
---

# Tasks: Forgot Password — Email Recovery

**Input**: Design documents from `/specs/001-forgot-password-email/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/api.md ✅, research.md ✅

**Tests**: Not explicitly requested — test tasks omitted except for the two existing spec files that set the pattern.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies, configure the mail module, and scaffold scaffolding that
every subsequent task depends on.

- [x] T001 Install new backend npm packages: `@nestjs-modules/mailer nodemailer handlebars` and dev dep `@types/nodemailer` in `apps/backend/`
- [x] T002 [P] Add mail environment variables to `apps/backend/envs/.env.example`: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `FRONTEND_URL`
- [x] T003 [P] Add `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `FRONTEND_URL` to the Joi validation schema in `apps/backend/src/infrastructure/modules/config.module.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, domain layer, and shared mail infrastructure that ALL user stories depend on.

⚠️ **CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T004 Add `PasswordResetToken` model and `passwordResetTokens` inverse relations to `Tenant` and `User` in `apps/backend/prisma/schema.prisma` — full model from `data-model.md`
- [x] T005 Add `tokenVersion Int @default(1) @map("token_version")` field to `User` model and `passwordResetTokens PasswordResetToken[]` relation in `apps/backend/prisma/schema.prisma`
- [x] T006 Run Prisma migration: `cd apps/backend && npx prisma migrate dev --name add_password_reset_tokens` — commit migration file
- [x] T007 [P] Create `PasswordResetToken` domain entity with `isExpired()`, `isUsed()`, `isValid()` methods in `apps/backend/src/domain/entities/auth/password-reset-token.entity.ts` — full class from `data-model.md`
- [x] T008 [P] Create `PasswordResetTokenRepository` abstract class with `create`, `findLatestByEmail`, `findById`, `markAsUsed`, `deleteAllForUser` methods in `apps/backend/src/domain/repositories/password-reset-token-repository.ts` — interface from `data-model.md`
- [x] T009 Create `PasswordResetTokenMapper` with `toDomain()` and `toPersistence()` static methods in `apps/backend/src/infrastructure/persistence/mappers/password-reset-token.mapper.ts`
- [x] T010 Create `PrismaPasswordResetTokenRepository` implementing `PasswordResetTokenRepository` using `PrismaService` in `apps/backend/src/infrastructure/persistence/repositories/prisma-password-reset-token.repository.ts`
- [x] T011 Create HTML Handlebars email template for reset password in `apps/backend/src/infrastructure/services/mail/templates/reset-password.hbs` — include `{{ userName }}`, `{{ tenantName }}`, `{{ tenantLogoUrl }}`, `{{ resetUrl }}`, `{{ expiryMinutes }}` variables; show logo block only if `tenantLogoUrl` is set
- [x] T012 [P] Create plain-text Handlebars email template in `apps/backend/src/infrastructure/services/mail/templates/reset-password.text.hbs` — same variables, no HTML
- [x] T013 Create `MailService` injectable class with `sendPasswordReset(to, payload)` method using `MailerService` in `apps/backend/src/infrastructure/services/mail/mail.service.ts`
- [x] T014 Update `apps/backend/src/infrastructure/services/index.ts` to export `MailService`
- [x] T015 Update `JwtStrategy.validate()` in `apps/backend/src/infrastructure/strategies/jwt.strategy.ts` to fetch the user by `(tenantId, sub)` and compare `payload.tokenVersion` vs `user.tokenVersion` — throw `UnauthorizedException` on mismatch

**Checkpoint**: Foundation ready — domain entities, repository, mail service, DB schema, and JWT revocation logic are in place.

---

## Phase 3: User Story 1 — Request Password Reset Link (Priority: P1) 🎯 MVP

**Goal**: User submits email; system sends a time-limited reset link; always returns generic message.

**Independent Test**: `POST /api/v1/auth/forgot-password` with a known email → 200 + email arrives in Mailpit.
Same request with unknown email → 200 + no email sent.

### Implementation for User Story 1

- [x] T016 [P] [US1] Create `ForgotPasswordDto` with `@IsEmail()` `email` field in `apps/backend/src/infrastructure/dtos/auth/forgot-password.dto.ts`
- [x] T017 [US1] Create `ForgotPasswordUseCase` in `apps/backend/src/application/use-cases/auth/forgot-password.use-case.ts`:
  - Inject `UserRepository`, `PasswordResetTokenRepository`, `MailService`, `ConfigService`
  - Look up user by email — if not found OR user inactive → return silently (no error thrown)
  - Check rate limit: query latest token for this user — if `createdAt > now - 5min` and `isValid()` → return silently
  - Generate token: `crypto.randomBytes(32).toString('hex')`
  - Hash token: `bcrypt.hash(plainToken, 10)`
  - Persist `PasswordResetToken` with `expiresAt = now + 1h`
  - Build `resetUrl`: `${FRONTEND_URL}/reset-password?token=${plainToken}&email=${email}`
  - Emit `EventEmitter2` event `'auth.forgot-password'` with payload (fire-and-forget) — `MailService.sendPasswordReset()` listens via `@OnEvent`
  - Return `{ message: "If this email is registered, you will receive a password reset link shortly." }`
- [x] T018 [US1] Wire `@OnEvent('auth.forgot-password')` handler in `MailService` to call `sendPasswordReset()` from the emitted payload in `apps/backend/src/infrastructure/services/mail/mail.service.ts`
- [x] T019 [US1] Add `POST auth/forgot-password` endpoint to `apps/backend/src/infrastructure/controllers/auth.controller.ts` — no auth guard; call `ForgotPasswordUseCase`; return 200 with message
- [x] T020 [US1] Export `ForgotPasswordDto` from `apps/backend/src/infrastructure/dtos/auth/index.ts`
- [x] T021 [US1] Add `ForgotPasswordUseCase`, `PasswordResetTokenRepository` → `PrismaPasswordResetTokenRepository`, `MailService`, `EventEmitter2` (from `eventemitter2` already installed) to providers and exports in `apps/backend/src/infrastructure/modules/auth.module.ts`; import `MailerModule.forRootAsync()` with config from `ConfigService` and `EventEmitterModule` (if not already imported in `AppModule`)
- [x] T022 [US1] Add `forgotPassword(email: string): Observable<{ message: string }>` method to `apps/frontend/src/app/core/services/auth.service.ts` — POST to `${API_URL}/auth/forgot-password`
- [x] T023 [US1] Create `ForgotPasswordComponent` (Standalone) in `apps/frontend/src/app/features/auth/forgot-password/forgot-password.component.ts`:
  - Reactive form with `email` field (`Validators.required`, `Validators.email`)
  - On submit: call `AuthService.forgotPassword()`; always show generic success message on both 200 and any error (anti-enumeration in UI too)
  - Loading state while request in flight
- [x] T024 [US1] Create HTML template in `apps/frontend/src/app/features/auth/forgot-password/forgot-password.component.html` — use existing `UiButtonComponent`, `UiCardComponent`, `UiInputFieldComponent` from `@shared/ui`; include "Back to login" link
- [x] T025 [P] [US1] Create SCSS in `apps/frontend/src/app/features/auth/forgot-password/forgot-password.component.scss`
- [x] T026 [US1] Add `/forgot-password` lazy route to `apps/frontend/src/app/app.routes.ts` — public, same level as `/login`
- [x] T027 [US1] Add "Forgot Password?" link to `apps/frontend/src/app/features/auth/login/login.component.html` pointing to `/forgot-password`

**Checkpoint**: User Story 1 fully functional — the request side of the flow works independently and can be tested with Mailpit.

---

## Phase 4: User Story 2 — Reset Password via Link (Priority: P1) 🎯 MVP

**Goal**: User follows reset link, submits new password, credentials updated, sessions revoked, redirected to login.

**Independent Test**: Use token seeded or obtained from Story 1 flow → `POST /api/v1/auth/reset-password` → 200 + login with new password works + old password fails.

### Implementation for User Story 2

- [x] T028 [P] [US2] Create `ResetPasswordDto` with `@IsString() token`, `@IsEmail() email`, `@IsString() @MinLength(8) newPassword` in `apps/backend/src/infrastructure/dtos/auth/reset-password.dto.ts`
- [x] T029 [US2] Create `ResetPasswordUseCase` in `apps/backend/src/application/use-cases/auth/reset-password.use-case.ts`:
  - Inject `UserRepository`, `PasswordResetTokenRepository`
  - Find user by email → if not found throw `BadRequestException('This reset link is invalid or has expired.')`
  - Find latest token for user → if not found throw same `BadRequestException`
  - Call `token.isValid()` → if false (expired or used) throw `BadRequestException`
  - `bcrypt.compare(input.token, storedToken.tokenHash)` → if false throw `BadRequestException`
  - Hash new password: `bcrypt.hash(input.newPassword, 10)`
  - Update user: `user.passwordHash = newHash`, increment `user.tokenVersion`
  - Call `UserRepository.update(tenantId, user)`
  - Call `PasswordResetTokenRepository.markAsUsed(token.id)`
  - Return `{ message: "Password reset successfully. Please log in with your new password." }`
- [x] T030 [US2] Export `ResetPasswordDto` from `apps/backend/src/infrastructure/dtos/auth/index.ts`
- [x] T031 [US2] Add `POST auth/reset-password` endpoint to `apps/backend/src/infrastructure/controllers/auth.controller.ts` — no auth guard; call `ResetPasswordUseCase`; return 200 with message
- [x] T032 [US2] Register `ResetPasswordUseCase` in providers and exports in `apps/backend/src/infrastructure/modules/auth.module.ts`
- [x] T033 [US2] Add `resetPassword(token, email, newPassword): Observable<{ message: string }>` method to `apps/frontend/src/app/core/services/auth.service.ts` — POST to `${API_URL}/auth/reset-password`
- [x] T034 [US2] Create `ResetPasswordComponent` (Standalone) in `apps/frontend/src/app/features/auth/reset-password/reset-password.component.ts`:
  - Read `token` and `email` from `ActivatedRoute` query params on init
  - If either param missing → show error state ("Invalid link — please request a new one")
  - Reactive form: `newPassword` (`MinLength(8)`) + `confirmPassword`; custom validator for password match
  - On submit: call `AuthService.resetPassword()`; on success navigate to `/login` with success query param; on error show API error message
  - Loading state while in flight
- [x] T035 [US2] Create HTML template in `apps/frontend/src/app/features/auth/reset-password/reset-password.component.html` — use existing shared UI components; show password-match inline error; success state with "Go to Login" button
- [x] T036 [P] [US2] Create SCSS in `apps/frontend/src/app/features/auth/reset-password/reset-password.component.scss`
- [x] T037 [US2] Add `/reset-password` lazy route to `apps/frontend/src/app/app.routes.ts` — public, same level as `/login`
- [x] T038 [US2] Display success toast or banner on `/login` page when navigated with `?success=password_reset` query param in `apps/frontend/src/app/features/auth/login/login.component.ts` and `login.component.html`

**Checkpoint**: User Stories 1 AND 2 working — full forgot-password flow is independently functional and testable end-to-end.

---

## Phase 5: User Story 3 — Resend Reset Email (Priority: P2)

**Goal**: User can return to `/forgot-password` after the rate-limit window and receive a new link; existing valid token is invalidated.

**Independent Test**: Wait for rate-limit window (or seed an old token); submit email again → new email arrives; old token is rejected.

### Implementation for User Story 3

- [x] T039 [US3] Update `ForgotPasswordUseCase` in `apps/backend/src/application/use-cases/auth/forgot-password.use-case.ts`:
  - Before creating a new token, call `PasswordResetTokenRepository.deleteAllForUser(tenantId, userId)` to invalidate any previous (unused, even if rate-limited) tokens for this user
  - Only call `deleteAllForUser` AFTER the 5-minute rate-limit check passes — so if within window, no deletion occurs and original token stays valid
- [x] T040 [US3] Update `ResetPasswordComponent` in `apps/frontend/src/app/features/auth/reset-password/reset-password.component.html` — when API returns 400 expired/used error, show a "Request a new link" button that navigates to `/forgot-password` (email pre-filled via query param if possible)
- [x] T041 [US3] Update `ForgotPasswordComponent` in `apps/frontend/src/app/features/auth/forgot-password/forgot-password.component.ts` — read optional `?email=` query param from route on init and pre-fill the email form field

**Checkpoint**: All three user stories independently functional. Re-request flow works seamlessly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalise integration, documentation, and production-readiness checks.

- [x] T042 [P] Add `LOGIN_SUCCESS_MESSAGE` env-like constant to `apps/frontend/src/app/features/auth/login/login.component.ts` to avoid magic string for `?success=password_reset` query param — or use a shared auth constants file
- [x] T043 [P] Update `apps/backend/src/infrastructure/modules/auth.module.ts` to ensure `EventEmitterModule` is imported in `AppModule` (check `apps/backend/src/app.module.ts`) — add if missing
- [x] T044 Add password-strength validation annotation (`@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)`) to `newPassword` field in `apps/backend/src/infrastructure/dtos/auth/reset-password.dto.ts` with a descriptive message
- [x] T045 [P] Update `apps/backend/src/application/use-cases/auth/login.use-case.ts` to embed `tokenVersion` in the JWT payload (`generateTokens` method) alongside `sub`, `email`, `name`, `role`, `tenantId`
- [x] T046 [P] Update `apps/backend/src/application/use-cases/auth/refresh-token.use-case.ts` to embed `tokenVersion` in the generated JWT payload — fetch `tokenVersion` from DB if not already in the incoming payload
- [x] T047 Validate end-to-end flow manually per `specs/001-forgot-password-email/quickstart.md` — check all 4 flows (happy path, anti-enumeration, expired token, rate limit)
- [x] T048 [P] Update `specs/001-forgot-password-email/checklists/requirements.md` — mark all implementation items as verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 (Phase 4)**: Depends on Foundational (Phase 2); integrates with US1 artifacts but independently testable
- **US3 (Phase 5)**: Depends on US1 and US2 completion — builds on both
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational — tests only the request side
- **US2 (P1)**: Independent after Foundational — can test with a seeded token without US1 running
- **US3 (P2)**: Extends US1 (reuses `ForgotPasswordUseCase`) and adds UX link from US2 error state

### Within Each User Story

- DTOs before use-cases
- Use-cases before controllers
- Backend endpoint before frontend service method
- Frontend service before component
- Component before route registration

### Parallel Opportunities

- T002, T003 can run in parallel with T001
- T007, T008 can run in parallel (domain layer, no deps on each other)
- T011, T012 can run in parallel (email templates)
- T016, T028 can run in parallel (DTOs in different files)
- T025, T036 can run in parallel (SCSS files)
- T045, T046 can run in parallel (independent use-case files)

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only — both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all)
3. Complete Phase 3: User Story 1 (request link)
4. Complete Phase 4: User Story 2 (reset password)
5. **STOP and VALIDATE**: Run quickstart.md flows 1-3
6. Deploy / demo the complete forgot-password flow

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. US1 → email request side live (can demo with Mailpit)
3. US2 → full reset flow live (MVP complete)
4. US3 → resend UX enhancement
5. Polish → production hardening

---

## Notes

- `[P]` = different files, no dependencies on incomplete sibling tasks
- `[US1/2/3]` maps each task to a specific user story for traceability
- Tests are not included per spec (not explicitly requested)
- The 5-minute rate-limit window is enforced in the use-case, not via ThrottlerModule
- `EventEmitter2` is already installed — no extra npm install needed for async email dispatch
- Mailpit is recommended for local SMTP testing (see quickstart.md)
- Stop at any checkpoint to validate the story independently before proceeding
