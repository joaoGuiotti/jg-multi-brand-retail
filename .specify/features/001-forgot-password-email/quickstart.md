# Quickstart: Forgot Password — Email Recovery

**Feature**: 001-forgot-password-email
**Created**: 2026-04-06

Use this guide to validate the feature end-to-end after implementation.

---

## Prerequisites

1. Running backend at `http://localhost:3000`
2. Running frontend at `http://localhost:4200`
3. Seeded database with at least one user (`admin@lojademo.com`)
4. SMTP credentials configured in `apps/backend/.env`:
   ```env
   MAIL_HOST=smtp.example.com
   MAIL_PORT=587
   MAIL_USER=your@email.com
   MAIL_PASS=yourpassword
   MAIL_FROM="Retail SaaS <no-reply@example.com>"
   FRONTEND_URL=http://localhost:4200
   ```
   For local testing, use [Mailpit](https://mailpit.axllent.org/) or [Mailtrap](https://mailtrap.io):
   ```env
   MAIL_HOST=localhost
   MAIL_PORT=1025
   MAIL_USER=
   MAIL_PASS=
   ```

---

## Flow 1: Happy Path (Forgot → Reset)

### Step 1 — Request reset link

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lojademo.com"}'
```

**Expected response** (200):
```json
{
  "message": "If this email is registered, you will receive a password reset link shortly."
}
```

Check Mailpit/Mailtrap inbox — you should see a reset email.

### Step 2 — Copy token from email URL

The email contains a link like:
```
http://localhost:4200/reset-password?token=abc123...&email=admin%40lojademo.com
```

Copy the `token` query param value.

### Step 3 — Reset password

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<paste token here>",
    "email": "admin@lojademo.com",
    "newPassword": "NovaS3nha@2026"
  }'
```

**Expected response** (200):
```json
{
  "message": "Password reset successfully. Please log in with your new password."
}
```

### Step 4 — Verify login with new password

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lojademo.com", "password": "NovaS3nha@2026"}'
```

**Expected**: 200 with `accessToken`.

### Step 5 — Verify old password fails

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lojademo.com", "password": "loja123"}'
```

**Expected**: 401 Unauthorized.

---

## Flow 2: Anti-Enumeration Check

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "notregistered@example.com"}'
```

**Expected**: Same 200 response as a valid email. No email sent.

---

## Flow 3: Expired / Used Token

Use the same token from Flow 1 Step 3 a second time:

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<same token>",
    "email": "admin@lojademo.com",
    "newPassword": "AnotherP@ss1"
  }'
```

**Expected**: 400 — `"This reset link is invalid or has expired."`

---

## Flow 4: Rate Limiting

Call `/forgot-password` twice within 5 minutes for the same email.

**Expected**: Both return 200 OK; only ONE email arrives in Mailpit.

---

## UI Validation

1. Navigate to `http://localhost:4200/login`
2. Click "Forgot Password?" link → redirected to `/forgot-password`
3. Submit the form with `admin@lojademo.com`
4. Confirmation message displayed
5. Open the reset link from email → `/reset-password?token=...&email=...`
6. Form pre-filled with email; enter new password + confirm
7. Redirect to `/login` with success toast
