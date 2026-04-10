# Implementation Plan: sprint1-notifications

**Branch**: `003-sprint1-notifications` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-sprint1-notifications/spec.md`

## Summary

Implement a real-time notification and alert system featuring WebSocket for bilateral user-targeted alerts (with read receipts) and SSE for one-way operational alert streams. This serves as the foundational module, as all subsequent features (Returns, Loyalty, etc.) will hook into it. 

## Technical Context

**Language/Version**: TypeScript 5.x via Node.js 20+ and Angular 17+  
**Primary Dependencies**: NestJS, Prisma, Angular Signals, Socket.IO (`@nestjs/websockets`, `socket.io-client`)  
**Storage**: PostgreSQL 15+, Redis 7+  
**Testing**: Jest (Backend unit/E2E), Jasmine/Jest (Frontend)  
**Target Platform**: Linux server (Docker), Web Browsers  
**Project Type**: Monorepo Web Application (`apps/backend`, `apps/frontend`, `libs/shared`)  
**Performance Goals**: Sub-2s dispatch to client delivery, UI handles 1000s of events without DOM lag  
**Constraints**: Deep multi-tenancy isolation strictly enforced, events must be debounced/rate-limited  
**Scale/Scope**: Horizontally scalable using Redis Adapter for WebSockets.  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Multi-Tenancy First**: ✅ YES. `tenant_id` is central to `Notification` and `NotificationPreference`. WebSocket channels uses `tenant_id:user_id` rooms.
- **Role-Based Access Control**: ✅ YES. Admin-only endpoints protected. User limits properly checked.
- **Type-Safety & Contract Integrity**: ✅ YES. Strict TS contracts inside `libs/shared/dtos`.
- **Observability & Error Handling**: ✅ YES. Socket connections and exceptions centrally caught and logged in JSON.
- **Simplicity & YAGNI**: ✅ YES. Features scoped accurately to the plan. Signals used for UI state over RxJS overhead.

## Project Structure

### Documentation (this feature)

```text
specs/003-sprint1-notifications/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── events.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── application/use-cases/notifications/
│   ├── domain/entities/notifications/
│   ├── domain/repositories/notifications/
│   ├── infrastructure/controllers/
│   ├── infrastructure/dtos/notifications/
│   ├── infrastructure/gateways/
│   ├── infrastructure/persistence/notifications/
│   ├── infrastructure/services/
│   └── infrastructure/modules/notifications.module.ts
└── prisma/
    └── schema.prisma (updated)

frontend/
├── src/app/features/notifications/
│   ├── components/
│   │   ├── notification-bell/
│   │   ├── notification-panel/
│   │   ├── notification-item/
│   │   └── notification-settings/
│   ├── services/
│   │   ├── notifications.service.ts
│   │   └── notifications-ws.service.ts
│   └── store/
│       └── notifications.store.ts
```

**Structure Decision**: Selected Option 2 (Monorepo Web Application) mapping strictly to the established Angular 17+ / NestJS DDD module architecture.
