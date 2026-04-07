# Feature Specification: Forgot Password — Email Recovery

**Feature Branch**: `001-forgot-password-email`
**Created**: 2026-04-06
**Status**: Draft
**Input**: User description: "implementar forgot password com uso de email para recuperação de senha"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Request Password Reset Link (Priority: P1)

An authenticated-less user who has forgotten their password visits the login page,
clicks "Forgot Password?", enters their registered email address, and receives a
time-limited reset link by email within minutes. The user does not need to know
whether that email exists in the system (to prevent user enumeration).

**Why this priority**: Without this step the entire flow is blocked. It is the
entry point and the highest-risk step from a security perspective.

**Independent Test**: Can be fully tested by submitting a valid (and an unknown)
email address to the forgot-password form and verifying that a confirmation
message is always displayed and, for known addresses, that a reset email is sent.

**Acceptance Scenarios**:

1. **Given** a user is on the login page, **When** they click "Forgot Password?",
   **Then** they are taken to the forgotten-password request page.
2. **Given** the user enters a registered email and submits, **When** the request is
   processed, **Then** a reset link is sent to that email and the page displays a
   generic confirmation message ("If this email is registered, you will receive a
   link shortly").
3. **Given** the user enters an unregistered email and submits, **When** the request
   is processed, **Then** the same generic confirmation message is displayed (no
   indication that the email does not exist).
4. **Given** the user submits an invalid email format, **When** the form is validated,
   **Then** an inline validation error is displayed before submission.
5. **Given** a valid request has already been made in the last 5 minutes, **When**
   the user submits again for the same email, **Then** a new token MUST NOT be
   generated; the system responds with the same generic message to prevent spam.

---

### User Story 2 — Reset Password via Link (Priority: P1)

The user receives the reset email, clicks the unique time-limited link, is taken
to a reset-password form, enters and confirms a new password, and successfully
updates their credentials. The link expires after use or after a set time window.

**Why this priority**: This is the core value delivery of the feature — without it,
the request step is meaningless. Both P1 stories form the indivisible MVP.

**Independent Test**: Can be fully tested end-to-end by obtaining a valid reset token
(via story 1 or seeding), navigating to the reset URL, submitting a new password,
and verifying login with the new credential works while the old one does not.

**Acceptance Scenarios**:

1. **Given** the user opens a valid, unexpired reset link, **When** the page loads,
   **Then** they are presented with a form to enter and confirm a new password.
2. **Given** the user enters a new password that meets strength requirements and a
   matching confirmation, **When** they submit, **Then** the password is updated,
   all existing refresh tokens for that user are revoked, and they are redirected
   to the login page with a success message.
3. **Given** the user enters mismatched passwords, **When** they submit, **Then**
   an inline validation error is shown and the form is NOT submitted.
4. **Given** the user opens an expired reset link (older than 1 hour), **When** the
   page loads, **Then** they see an error message ("This link has expired") and a
   prompt to request a new one.
5. **Given** the user opens a link that has already been used, **When** the page
   loads, **Then** they see an error message ("This link has already been used")
   and a prompt to request a new one.
6. **Given** the user opens a link with a tampered/invalid token, **When** the page
   loads, **Then** they see a generic error and are not allowed to proceed.

---

### User Story 3 — Resend Reset Email (Priority: P2)

If the user did not receive the email or the link expired before use, they can
return to the forgot-password page and request a new link.

**Why this priority**: Improves usability and reduces support load, but the base
flow (US1 + US2) already constitutes a valid MVP.

**Independent Test**: Testable by navigating back to the forgot-password page,
submitting the same email after the rate-limit window has elapsed, and confirming
a new email is sent.

**Acceptance Scenarios**:

1. **Given** the user returns to the forgot-password page after the rate-limit window,
   **When** they submit their email again, **Then** a new token is generated, the
   old token is invalidated, and a fresh email is sent.
2. **Given** the user clicks "Request a new link" from the expired-link page, **When**
   they are redirected to the forgot-password page, **Then** their email is
   pre-filled (if technically feasible from the URL or session state).

---

### Edge Cases

- What happens if the email service is unavailable at the time of the request?
  The system MUST return an appropriate error to the user ("Email could not be sent
  — please try again later") without leaking the reason internally.
- What happens when a user resets their password while logged in on other devices?
  All active refresh tokens MUST be revoked on successful password reset.
- What happens if the user's account is disabled/deactivated?
  The system MUST still respond with the generic confirmation and MUST NOT send an
  email (preventing enumeration while respecting account state).
- What happens if the reset link is shared or intercepted?
  Tokens MUST be single-use. After one successful reset the token is permanently
  invalidated.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "Forgot Password?" entry point on the login page.
- **FR-002**: The system MUST accept a user's email address and initiate the reset flow.
- **FR-003**: The system MUST send an email containing a unique, time-limited (1-hour TTL)
  reset link to the registered address.
- **FR-004**: The system MUST respond with an identical generic confirmation message
  regardless of whether the email is registered (prevent user enumeration).
- **FR-005**: The system MUST enforce a rate limit: no new token MUST be generated for
  the same email within a 5-minute window.
- **FR-006**: The reset link MUST redirect the user to a password-reset form and MUST
  accept a new password and a confirmation field.
- **FR-007**: The system MUST validate that the new password meets the configured strength
  policy before accepting it.
- **FR-008**: The system MUST validate that the password and confirmation fields match.
- **FR-009**: Upon successful reset, the system MUST update the user's hashed password
  and mark the token as used/expired.
- **FR-010**: Upon successful reset, the system MUST revoke all active refresh tokens for
  that user (force re-authentication on all devices).
- **FR-011**: The system MUST reject expired tokens (TTL > 1 hour) and already-used tokens.
- **FR-012**: The system MUST reject tampered or malformed tokens.
- **FR-013**: The feature MUST respect the multi-tenant architecture: reset tokens MUST be
  scoped to a specific tenant, and cross-tenant token usage MUST be rejected.
- **FR-014**: The reset email MUST include the tenant's brand name and logo (if configured)
  to maintain multi-brand identity.

### Key Entities *(include if feature involves data)*

- **PasswordResetToken**: Represents a single-use reset request. Key attributes:
  token (unique, hashed), user reference, tenant reference, expiry timestamp,
  used-at timestamp, created-at timestamp.
- **User**: Existing entity; gains no new fields — password hash is updated on
  successful reset.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A registered user MUST be able to complete the full forgot-password flow
  (request → email → reset) in under 3 minutes under normal network conditions.
- **SC-002**: The system MUST respond to a forgot-password request within 3 seconds
  (from submission to confirmation message displayed), even when the email is queued
  asynchronously.
- **SC-003**: 100% of reset tokens MUST expire within 1 hour of creation and MUST be
  single-use.
- **SC-004**: Users MUST NOT be able to determine whether an email address is registered
  through any response differentiator (timing, message, or status code).
- **SC-005**: After a successful password reset, the user MUST be able to log in with
  the new password and MUST NOT be able to log in with the old password.
- **SC-006**: After a successful password reset, all previously issued refresh tokens
  MUST be invalid within 1 minute of the reset.

---

## Assumptions

- The platform already has a functional email-sending infrastructure (SMTP, SES, or
  equivalent) that can be used by the backend service.
- Email delivery is handled asynchronously (via BullMQ or equivalent queue) to
  avoid blocking the HTTP response.
- Password strength policy (minimum length, character requirements) is already
  defined in the system and will be reused without change.
- The reset-password page is accessible without authentication (public route).
- The current login flow and session management (JWT + refresh token) remain
  unchanged; only the credential update and token revocation steps interact with
  existing auth infrastructure.
- Mobile-specific deep-link handling for the reset URL is out of scope for v1; the
  feature targets the web frontend only.
- Email templates will use the existing email-template system; HTML/plain-text
  versions are both required.
- Tenant context for the reset flow is inferred from the email address (which is
  unique per tenant) or from a `tenantId` param encoded in the reset link.
