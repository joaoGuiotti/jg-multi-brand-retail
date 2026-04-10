# Data Model: Forgot Password — Email Recovery

**Feature**: 001-forgot-password-email
**Created**: 2026-04-06
**Phase**: 1 — Design

---

## New Entity: PasswordResetToken

### Purpose
Stores a single-use, time-limited token that authorises a user to pick a new password.
Each row is scoped to one `(user, tenant)` pair and is consumed (marked used) on success.

### Prisma Schema Addition

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  tenantId  String    @map("tenant_id")
  userId    String    @map("user_id")
  tokenHash String    @map("token_hash")       // bcrypt hash of the plain token
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")           // null = unused; set on consume
  createdAt DateTime  @default(now()) @map("created_at")

  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  user      User      @relation(fields: [userId],  references: [id])

  @@index([tenantId])
  @@index([userId])
  @@map("password_reset_tokens")
}
```

### Field Notes

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `tenantId` | String | Required; resolved from user lookup; enforces tenant scope |
| `userId` | String | Required; FK to `users.id` |
| `tokenHash` | String | bcrypt hash of the 64-char hex plain token |
| `expiresAt` | DateTime | `createdAt + 1 hour`; set at creation time |
| `usedAt` | DateTime? | `null` until consumed; set to `NOW()` on successful reset |
| `createdAt` | DateTime | Auto-set by Prisma |

### State Transitions

```
[CREATED] ──(time elapses > 1h)──→ [EXPIRED]   (expiresAt < now)
[CREATED] ──(resetPassword OK) ──→ [CONSUMED]   (usedAt set)
[EXPIRED] or [CONSUMED] ──(resetPassword attempt)──→ 400 Bad Request
```

---

## Modified Entity: User

### Change
Add `tokenVersion` field for stateless refresh-token revocation on password reset.

```prisma
model User {
  // ... existing fields ...
  tokenVersion Int @default(1) @map("token_version")  // NEW
}
```

| Field | Type | Rules |
|---|---|---|
| `tokenVersion` | Int | Starts at 1; incremented on every successful password reset; embedded in JWT payload |

### JWT Payload impact
`tokenVersion` MUST be added to the JWT payload in `LoginUseCase` and `RefreshTokenUseCase`.
`JwtStrategy.validate()` MUST fetch the user from DB and compare `payload.tokenVersion`
against `user.tokenVersion`; mismatch → `UnauthorizedException`.

---

## Tenant Relation Addition

The `Tenant` model in `schema.prisma` MUST add the inverse relation:
```prisma
model Tenant {
  // ... existing relations ...
  passwordResetTokens PasswordResetToken[]  // NEW
}
```

And `User` model:
```prisma
model User {
  // ... existing relations ...
  passwordResetTokens PasswordResetToken[]  // NEW
}
```

---

## New Domain Interfaces

### PasswordResetToken Entity (domain)

```typescript
// apps/backend/src/domain/entities/auth/password-reset-token.entity.ts
export class PasswordResetToken {
  id: string;
  tenantId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }
}
```

### PasswordResetTokenRepository Interface (domain)

```typescript
// apps/backend/src/domain/repositories/password-reset-token-repository.ts
export abstract class PasswordResetTokenRepository {
  abstract create(token: PasswordResetToken): Promise<PasswordResetToken>;
  abstract findLatestByEmail(email: string): Promise<PasswordResetToken | null>;
  abstract findById(id: string): Promise<PasswordResetToken | null>;
  abstract markAsUsed(id: string): Promise<void>;
  abstract deleteAllForUser(tenantId: string, userId: string): Promise<void>;
}
```
