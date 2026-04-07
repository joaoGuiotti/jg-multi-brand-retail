# API Contracts: Forgot Password — Email Recovery

**Feature**: 001-forgot-password-email
**Created**: 2026-04-06
**Base path**: `/api/v1/auth`
**Auth required**: ❌ All endpoints in this feature are unauthenticated (public)

---

## POST /auth/forgot-password

Initiates the password reset flow. Accepts a user's email address and
sends a reset link if the email is registered.

### Request

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "user@example.com"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | ✅ | Valid email format |

### Response — 200 OK (always, regardless of email existence)

```json
{
  "message": "If this email is registered, you will receive a password reset link shortly."
}
```

> **Security note**: The response MUST be identical whether the email exists or not.
> HTTP status MUST be 200 in both cases to prevent timing-based enumeration.

### Response — 400 Bad Request (invalid email format)

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### Rate limit behaviour (application-level)

If a valid, unused token was issued for this email in the last 5 minutes,
the endpoint returns **200 OK** with the same generic message and NO new
token is generated.

---

## POST /auth/reset-password

Validates the reset token and updates the user's password.

### Request

```http
POST /api/v1/auth/reset-password
Content-Type: application/json
```

```json
{
  "token": "a3f9c2...64hex...",
  "email": "user@example.com",
  "newPassword": "MyNewP@ssw0rd"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `token` | string | ✅ | 64-char hex string |
| `email` | string | ✅ | Valid email format; identifies the user |
| `newPassword` | string | ✅ | Min 8 characters; at least 1 uppercase, 1 lowercase, 1 digit |

### Response — 200 OK (password updated successfully)

```json
{
  "message": "Password reset successfully. Please log in with your new password."
}
```

### Response — 400 Bad Request (token expired or already used)

```json
{
  "statusCode": 400,
  "message": "This reset link is invalid or has expired.",
  "error": "Bad Request"
}
```

### Response — 400 Bad Request (validation errors)

```json
{
  "statusCode": 400,
  "message": ["newPassword must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

---

## Frontend Route Contracts

| Route | Component | Public |
|---|---|---|
| `/forgot-password` | `ForgotPasswordComponent` | ✅ |
| `/reset-password?token=<token>&email=<email>` | `ResetPasswordComponent` | ✅ |

### URL Parameters for `/reset-password`

| Param | Required | Description |
|---|---|---|
| `token` | ✅ | Plain reset token from email link |
| `email` | ✅ | User email (pre-fills form, sent to API) |

---

## Email Template Contract

### Subject
`Redefinição de senha — {{ tenantName }}`

### HTML Body Variables

| Variable | Description |
|---|---|
| `{{ userName }}` | First name of the user |
| `{{ tenantName }}` | Tenant brand name |
| `{{ tenantLogoUrl }}` | Tenant logo URL (optional; hide block if null) |
| `{{ resetUrl }}` | Full reset URL with token + email query params |
| `{{ expiryMinutes }}` | Token TTL in minutes (60) |

### Example Reset URL
```
https://app.example.com/reset-password?token=a3f9c2...&email=user%40example.com
```
