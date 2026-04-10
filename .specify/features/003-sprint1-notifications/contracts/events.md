# Real-Time Event Contracts

## WebSocket (Socket.IO)

**Namespaces / Rooms**:
Socket clients join rooms formatted as `${tenant_id}:${user_id}` on connection verification.

**Server-to-Client Events**:
- `notification_receive`
  - Payload Shape: 
    ```typescript
    {
      id: string;
      type: NotificationType;
      priority: NotificationPriority;
      title: string;
      message: string;
      data?: Record<string, any>;
      actionUrl?: string;
      createdAt: string;
    }
    ```

**Client-to-Server Events**:
- `mark_as_read`
  - Payload Shape: `{ notificationId: string }`
  - Acknowledgment: Returns `{ success: true }` upon DB save.

## Server-Sent Events (SSE)

**Endpoint**: `GET /api/v1/notifications/stream` (Protected by JWT)
**Payload Format**: standard SSE format (`data: <json string>`).
- Sub-event streams for operations (e.g., dashboard counters or goal ticks).

## REST API (Fallback & History)

- `GET /api/v1/notifications` -> Paged results of historical notifications.
- `GET /api/v1/notifications/unread-count` -> Returns `{ count: number }`.
- `PATCH /api/v1/notifications/read-all` -> Marks all as read.
- `GET /api/v1/notifications/preferences` -> Returns user preferences.
- `PUT /api/v1/notifications/preferences` -> Updates preferences array.
