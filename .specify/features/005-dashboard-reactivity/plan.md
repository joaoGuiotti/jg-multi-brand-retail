# Implementation Plan: Dashboard Reactivity & Real-Time Data Updates

**Branch**: `005-dashboard-reactivity` | **Date**: 2026-04-20 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `.specify/features/005-dashboard-reactivity/spec.md`

---

## Summary

The dashboard currently loads all data once on startup via 6 parallel REST calls (`forkJoin`) and never refreshes. This plan introduces a **push-based real-time update architecture** that extends the existing `OperationalStreamService` (SSE) infrastructure already present in the codebase. The backend emits typed `DashboardEvent` messages at the end of the relevant use cases (`CreateSaleUseCase`, `CompleteSaleUseCase`, `CreateMovementUseCase`); the frontend receives them via SSE, reconstructs widget state locally, and updates Angular Signals without additional REST calls.

A **dedicated BFF (Backend-for-Frontend) gateway** is **not introduced** for this feature. Research confirms that event-driven SSE push — already available via `OperationalStreamService` — eliminates the need for BFF aggregation in the steady state. A single BFF snapshot endpoint (`GET /api/v1/dashboard/snapshot`) **is** introduced to serve the initial page-load aggregate (replacing 6 parallel calls with 1), which also resolves FR-010.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+ (backend); Angular 17+ (frontend)  
**Primary Dependencies**: NestJS (backend), Angular Signals + RxJS (frontend), Socket.IO/SSE (`OperationalStreamService`)  
**Storage**: PostgreSQL 15+ via Prisma ORM (no new tables needed)  
**Testing**: Jest (backend unit + integration), Jasmine/Karma (frontend unit)  
**Target Platform**: Web browser (desktop-first), served via Docker  
**Performance Goals**: KPI update within 30 seconds of business event; initial load via single BFF call; revenue chart refresh ≤5 min  
**Constraints**: Strict tenant isolation on all events; zero subscription leaks across navigation cycles; SSE reconnection with exponential backoff  
**Scale/Scope**: Single-tenant sessions; N concurrent dashboard tabs per session must be independent

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Multi-Tenancy First | ✅ PASS | All SSE events filtered by `tenantId` in `OperationalStreamService.getStream()`. New dashboard events tagged with `tenantId` at emission site (use case layer). BFF snapshot endpoint scoped via `@CurrentUser()`. |
| II. RBAC Everywhere | ✅ PASS | SSE stream endpoint already uses `JwtAuthGuard`. BFF snapshot endpoint will use `JwtAuthGuard + RolesGuard` with `[ADMIN, USER]`. Dashboard component is behind the existing `authGuard`. |
| III. Type-Safety & Contract Integrity | ✅ PASS | `DashboardEvent` payload types defined in `libs/shared/` with strict TypeScript interfaces; no `any` on event payloads. |
| IV. Observability & Structured Error Handling | ✅ PASS | `OperationalStreamService` already has `Logger`. Event emission failures caught at use case boundary; SSE stream failure degrades to `null` without blocking primary flow. |
| V. Simplicity & YAGNI | ✅ PASS | Extending existing SSE infrastructure — no new transport technology introduced. BFF gateway not introduced (SSE push makes it redundant for steady state). Angular Signals already used in dashboard — extending, not replacing. |

**Post-Design Re-check**: Required after Phase 1. Focus on confirming no `any` types leak into the new `DashboardService` frontend service and that the `DashboardSnapshotController` import graph doesn't create circular module dependencies within `SalesModule`/`InventoryModule`.

---

## Project Structure

### Documentation (this feature)

```text
.specify/features/005-dashboard-reactivity/
├── spec.md
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   ├── dashboard-event.contract.md
│   └── dashboard-snapshot.contract.md
└── checklists/
    ├── requirements.md
    └── realtime.md
```

### Source Code Layout (affected files)

```text
apps/backend/src/
├── application/
│   └── use-cases/
│       ├── sales/
│       │   ├── create-sale.use-case.ts          [MODIFY] — emit DashboardEvent on complete
│       │   └── complete-sale.use-case.ts         [MODIFY] — emit DashboardEvent on complete
│       ├── inventory/
│       │   └── create-movement.use-case.ts       [MODIFY] — emit DashboardEvent on movement
│       └── dashboard/                            [NEW]
│           └── get-dashboard-snapshot.use-case.ts
├── infrastructure/
│   ├── controllers/
│   │   └── dashboard.controller.ts              [NEW] — BFF snapshot endpoint
│   └── modules/
│       ├── dashboard.module.ts                  [NEW]
│       └── sales.module.ts                      [MODIFY] — import NotificationsModule for OperationalStreamService

apps/frontend/src/app/
├── core/
│   └── services/
│       └── dashboard.service.ts                 [NEW] — SSE subscription + snapshot REST call
├── features/
│   └── dashboard/
│       └── dashboard.component.ts               [MODIFY] — use DashboardService for reactive data
```

**Structure Decision**: Web application layout (Option 2). Backend follows existing module/controller/use-case conventions. Frontend uses a new `DashboardService` in `core/services/` consistent with `SalesService`, `InventoryService` patterns.

---

## Complexity Tracking

> No Constitution violations detected. Table not required.
