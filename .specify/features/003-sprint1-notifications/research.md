# Research: Real-Time Notifications & Alerts

## Technical Context Resolution

Since the project strictly follows an already outlined roadmap and constitution, there were no unresolved `NEEDS CLARIFICATION` items. The stack details and choices have been extracted directly from the system constitution and the retail SaaS reference architecture.

### Technology Choices

- **Decision**: `@nestjs/platform-socket.io` and `socket.io-client` for real-time bi-directional events. Server-Sent Events (SSE) for one-way streams.
- **Rationale**: Socket.IO handles fallback mechanisms (like polling if WS fails) and reconnections out of the box. SSE is native to HTTP and NestJS has built-in support for it, making it extremely lightweight for one-way dashboard feeds.
- **Alternatives considered**: Native WebSockets (`ws`). Rejected because Socket.IO provides better broadcasting and room capabilities (`tenant_id:user_id` mapping) which is critical for the multi-tenant architecture.

- **Decision**: `@socket.io/redis-adapter` for multi-instance scaling.
- **Rationale**: The backend might scale horizontally. Redis adapter ensures events emitted from one Node.js instance reach clients connected to another.
- **Alternatives considered**: RabbitMQ or Kafka. Rejected due to YAGNI (Redis is already part of the stack for caching and BullMQ, keeping dependencies lean is preferred).

- **Decision**: PostgreSQL + Prisma for Notification persistence.
- **Rationale**: Ensures historical data access (syncing read/unread states when the user is offline) and allows complex queries (e.g., filtering notifications by tenant, type, date).
- **Alternatives considered**: Redis lists or MongoDB. Rejected because relational consistency with `Tenant` and `User` entities is strictly required by the Constitution.
