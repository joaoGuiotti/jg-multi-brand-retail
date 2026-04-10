# Data Model: Real-Time Notifications

## Prisma Schema Updates

```prisma
enum NotificationType {
  LOW_STOCK
  OUT_OF_STOCK
  GOAL_ACHIEVED
  RETURN_PENDING
  RETURN_APPROVED
  PROMOTION_EXPIRING
  SALE_COMPLETED
  COMMISSION_CALCULATED
  SYSTEM
}

enum NotificationPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Notification {
  id        String               @id @default(uuid())
  tenantId  String               @map("tenant_id")
  userId    String               @map("user_id")
  type      NotificationType
  priority  NotificationPriority @default(MEDIUM)
  title     String
  message   String
  data      Json?                // Contextual data like { "productId": "...", "saleId": "..." }
  actionUrl String?              @map("action_url") // Deep-link application path
  readAt    DateTime?            @map("read_at")
  createdAt DateTime             @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([userId, readAt])
  @@index([createdAt])
  @@map("notifications")
}

model NotificationPreference {
  id       String           @id @default(uuid())
  tenantId String           @map("tenant_id")
  userId   String           @map("user_id")
  type     NotificationType
  enabled  Boolean          @default(true)
  sound    Boolean          @default(true)

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([userId, type])
  @@map("notification_preferences")
}
```

## Validation & State Transitions

- **Notification Preference Defaults**: At system startup or user creation, missing preferences for a given user should be assumed to be `enabled = true` and `sound = true` unless explicit rows exist that state otherwise.
- **Mark As Read Transition**: `readAt` transitions from `null` to `DateTime.now()`. This is a one-way transition (cannot be marked unread in v1).
- **Tenant Constraints**: Prisma queries must ALWAYS logically AND the execution against the current user's `tenantId`.
