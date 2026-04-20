# Tasks: Dashboard Reactivity & Real-Time Data Updates

**Branch**: `005-dashboard-reactivity`  
**Input**: `.specify/features/005-dashboard-reactivity/` — plan.md, spec.md, data-model.md, research.md, contracts/  
**Tests**: Not explicitly requested in spec — unit tests for new use cases and service included.

**Organization**: Tasks grouped by user story (P1→P2→P3) to enable independent implementation and validation of each increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: Maps task to User Story from spec.md (US1, US2, US3)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Type Definitions & Infrastructure Wiring)

**Purpose**: Define shared TypeScript interfaces and wire `OperationalStreamService` into Sales and Inventory modules. These are prerequisites for all user story phases — no story implementation starts until this phase is complete.

> **⚠️ CRITICAL**: All Phase 1 tasks must complete before any Phase 2+ task begins.

- [x] T001 Define `DashboardEventType` enum and `DashboardSaleCompletedPayload`, `DashboardStockChangedPayload`, `DashboardEvent` TypeScript interfaces in `apps/backend/src/application/use-cases/dashboard/dashboard-event.types.ts`
- [x] T002 [P] Define `DashboardSnapshotResponse`, `DashboardRecentSale`, `DashboardRecentMovement`, `DashboardDailyRevenue` response interfaces in `apps/frontend/src/app/core/models/dashboard.model.ts`
- [x] T003 [P] Add `NotificationsModule` to the `imports` array of `apps/backend/src/infrastructure/modules/sales.module.ts` to export `OperationalStreamService` to `SalesModule`
- [x] T004 [P] Add `NotificationsModule` to the `imports` array of `apps/backend/src/infrastructure/modules/inventory.module.ts` to export `OperationalStreamService` to `InventoryModule`

**Checkpoint**: Shared types defined; `OperationalStreamService` injectable in both `SalesModule` and `InventoryModule`.

---

## Phase 2: Foundational (Backend BFF Snapshot Endpoint)

**Purpose**: Create the `GET /api/v1/dashboard/snapshot` endpoint that replaces the 6 parallel REST calls on initial page load. This is the foundation for the frontend service introduced in US1.

> **⚠️ CRITICAL**: Must complete before US1 frontend work begins.

- [x] T005 Create `GetDashboardSnapshotUseCase` in `apps/backend/src/application/use-cases/dashboard/get-dashboard-snapshot.use-case.ts` — aggregates KPIs (today's sales/revenue, stock summary, product count), last 6 sales, last 6 movements, and 7-day daily revenue using `PrismaService` directly (reuse query patterns from `GetStockSummaryUseCase` and `GetDailyRevenueUseCase`)
- [x] T006 Create `DashboardController` in `apps/backend/src/infrastructure/controllers/dashboard.controller.ts` — exposes `GET /dashboard/snapshot` protected by `JwtAuthGuard + RolesGuard([ADMIN, USER])`, uses `@CurrentUser()` for tenant scoping, returns `GetDashboardSnapshotUseCase` output
- [x] T007 Create `DashboardModule` in `apps/backend/src/infrastructure/modules/dashboard.module.ts` — imports `PrismaModule`, registers `GetDashboardSnapshotUseCase` as provider, registers `DashboardController`
- [x] T008 Add `DashboardModule` to the `imports` array of `apps/backend/src/app.module.ts`
- [x] T009 Write unit test for `GetDashboardSnapshotUseCase` in `apps/backend/src/application/use-cases/dashboard/__tests__/get-dashboard-snapshot.use-case.spec.ts` — mock `PrismaService`, assert correct KPI aggregation, tenant scoping, and response shape

**Checkpoint**: `GET /api/v1/dashboard/snapshot` is callable, returns correct shape, and is tenant-isolated. Validate with `curl` or Swagger before proceeding.

---

## Phase 3: User Story 1 — Live KPI Dashboard (Priority: P1) 🎯 MVP

**Goal**: KPI cards (revenue today, sales today, low stock, out of stock) and feed panels update automatically within 30 seconds of a business event — no page reload required.

**Independent Test**: Complete a new sale via POS while the dashboard is open. Verify `salesToday` and `revenueToday` KPI cards update within 30 seconds without refreshing the page.

### Backend — Event Emission

- [x] T010 [US1] Inject `OperationalStreamService` into `CreateSaleUseCase` constructor in `apps/backend/src/application/use-cases/sales/create-sale.use-case.ts` — emit `dashboard.sale_completed` event with `DashboardSaleCompletedPayload` after the Prisma transaction succeeds and the sale status is `COMPLETED`
- [x] T011 [US1] Inject `OperationalStreamService` into `CompleteSaleUseCase` constructor in `apps/backend/src/application/use-cases/sales/complete-sale.use-case.ts` — emit `dashboard.sale_completed` event with `DashboardSaleCompletedPayload` after `saleRepository.update()` succeeds
- [x] T012 [US1] Inject `OperationalStreamService` into `CreateMovementUseCase` constructor in `apps/backend/src/application/use-cases/inventory/create-movement.use-case.ts` — emit `dashboard.stock_changed` event with `DashboardStockChangedPayload` (including `newStockLevel` from updated product) after `inventoryRepository.create()` succeeds
- [x] T013 [P] [US1] Write unit test for `CreateSaleUseCase` event emission in `apps/backend/src/application/use-cases/sales/__tests__/create-sale.use-case.spec.ts` — assert `OperationalStreamService.pushEvent()` is called with correct type and payload when sale is completed
- [x] T014 [P] [US1] Write unit test for `CompleteSaleUseCase` event emission in `apps/backend/src/application/use-cases/sales/__tests__/complete-sale.use-case.spec.ts` — assert event is emitted with correct `saleId`, `total`, `itemCount`
- [x] T015 [P] [US1] Write unit test for `CreateMovementUseCase` event emission in `apps/backend/src/application/use-cases/inventory/create-movement.use-case.spec.ts` — assert `dashboard.stock_changed` event is emitted with `newStockLevel` equal to post-movement product stock

### Frontend — DashboardService

- [x] T016 [US1] Create `DashboardService` in `apps/frontend/src/app/core/services/dashboard.service.ts` — provide in component scope (NOT `root`); expose all reactive signals (`revenueToday`, `salesToday`, `lowStock`, `outOfStock`, `totalProducts`, `recentSales`, `recentMovements`, `chartOptions`, `isLoading`, `isStale`, `connectionState`); implement `loadSnapshot()` calling `GET /api/v1/dashboard/snapshot` and populating signals
- [x] T017 [US1] Add SSE subscription method to `DashboardService` in `apps/frontend/src/app/core/services/dashboard.service.ts` — open `EventSource` to `/api/v1/notifications/stream` with JWT auth header; on `dashboard.sale_completed` event: increment `salesToday`, add `payload.total` to `revenueToday`, prepend to `recentSales` (keep top 6); on `dashboard.stock_changed` event: recompute `lowStock`/`outOfStock` from `newStockLevel` thresholds (0 = outOfStock, 1–10 = lowStock), prepend to `recentMovements` (keep top 6)
- [x] T018 [US1] Add connection resilience to `DashboardService` in `apps/frontend/src/app/core/services/dashboard.service.ts` — on `EventSource.onerror`: set `connectionState = 'reconnecting'`, set `isStale = true`; implement exponential backoff reconnection (initial 1s, factor 2, max 30s, max 10 attempts); on reconnect success: set `connectionState = 'connected'`, `isStale = false`, call `loadSnapshot()` to refresh; after 10 failures: set `connectionState = 'disconnected'`
- [x] T019 [US1] Add `takeUntilDestroyed()` lifecycle management to `DashboardService` subscriptions in `apps/frontend/src/app/core/services/dashboard.service.ts` — close `EventSource` and cancel all `interval` subscriptions on component destruction to prevent memory leaks; accept `DestroyRef` in constructor

### Frontend — DashboardComponent Refactor

- [x] T020 [US1] Refactor `DashboardComponent` in `apps/frontend/src/app/features/dashboard/dashboard.component.ts` — replace the 6-call `forkJoin` in `ngOnInit()` with: (1) provide `DashboardService` in component providers array, (2) call `dashboardService.loadSnapshot()`, (3) call `dashboardService.connectSSE(destroyRef)`, (4) bind all template signals to `dashboardService.*` signals instead of local component signals
- [x] T021 [US1] Add stale-data status indicator to `apps/frontend/src/app/features/dashboard/dashboard.component.html` — replace the static "Updated now" text with a conditional display: show "⚡ Ao vivo" when `connectionState() === 'connected'`, "⚠ Reconectando…" when `'reconnecting'`, "⚠ Dados podem estar desatualizados" with refresh button when `'disconnected'`
- [x] T022 [P] [US1] Write unit test for `DashboardService` in `apps/frontend/src/app/core/services/dashboard.service.spec.ts` — mock `HttpClient` and `EventSource`; assert snapshot populates signals correctly; assert `sale_completed` event increments KPIs; assert `stock_changed` recalculates thresholds correctly

**Checkpoint**: US1 complete and independently testable. Open dashboard → complete a sale via POS → verify KPI cards update without page reload.

---

## Phase 4: User Story 2 — Live Recent Sales & Inventory Movements Feed (Priority: P2)

**Goal**: The Recent Sales and Recent Inventory Movements feed panels automatically prepend new entries as events occur.

**Independent Test**: Open dashboard, register a new sale or movement, verify new entry appears at the top of the corresponding feed panel within 30 seconds without page reload.

> **Dependency**: Requires Phase 3 (US1) complete — feed update logic is part of `DashboardService` SSE handler already implemented in T017. US2 is primarily about validating and polishing the feed behavior specifically.

- [x] T023 [US2] Audit the `RecentSalesComponent` in `apps/frontend/src/app/features/dashboard/components/recent-sales/` — confirm it accepts the `DashboardRecentSale[]` input shape from the new `dashboard.model.ts` (not the legacy `Sale[]` from `sale.model.ts`); update `@Input()` type if needed to match `DashboardRecentSale` from `apps/frontend/src/app/core/models/dashboard.model.ts`
- [x] T024 [US2] Audit the `InventoryMovementsComponent` in `apps/frontend/src/app/features/dashboard/components/inventory-movements/` — confirm it accepts `DashboardRecentMovement[]` input shape; update `@Input()` type if needed to match `DashboardRecentMovement` from `apps/frontend/src/app/core/models/dashboard.model.ts`
- [x] T025 [P] [US2] Update `apps/frontend/src/app/features/dashboard/dashboard.component.html` bindings for feed panels — pass `dashboardService.recentSales()` and `dashboardService.recentMovements()` signals to `<app-recent-sales>` and `<app-inventory-movements>` components (replace any remaining local signal references)
- [x] T026 [P] [US2] Add "new entry" visual flash animation to `apps/frontend/src/app/features/dashboard/components/recent-sales/recent-sales.component.scss` and `inventory-movements/inventory-movements.component.scss` — apply a brief highlight/fade-in CSS animation on `:first-child` rows when the feed list changes (uses Angular `@if` / `@for` change detection)

**Checkpoint**: US1 + US2 complete. Both KPI cards and feed panels update live. Feed first row flashes when a new entry arrives.

---

## Phase 5: User Story 3 — Revenue Chart Auto-Refresh (Priority: P3)

**Goal**: The 7-day revenue area chart refreshes every 5 minutes without a page reload.

**Independent Test**: Open dashboard, wait 5 minutes (or reduce interval to 10 seconds for testing), register sales, verify the current-day bar on the chart increases without page reload.

- [x] T027 [US3] Add `startChartAutoRefresh()` method to `DashboardService` in `apps/frontend/src/app/core/services/dashboard.service.ts` — use `interval(5 * 60 * 1000).pipe(startWith(0), takeUntilDestroyed(this.destroyRef))` to call `GET /api/v1/sales/reports/daily-revenue?days=7` every 5 minutes; on success: invoke the existing `setupChart(data)` logic (migrated from `DashboardComponent`) and update `chartOptions` signal; on error: log warn but do not affect `isStale` or `connectionState` state
- [x] T028 [US3] Migrate the `setupChart()` private method from `apps/frontend/src/app/features/dashboard/dashboard.component.ts` into `DashboardService` in `apps/frontend/src/app/core/services/dashboard.service.ts` — keep chart theme reactivity logic intact (dark/light mode effect); update the component to call `dashboardService.chartOptions()` signal instead of the local signal
- [x] T029 [US3] Call `dashboardService.startChartAutoRefresh()` from `DashboardComponent.ngOnInit()` in `apps/frontend/src/app/features/dashboard/dashboard.component.ts` — remove the `revenueReport` key from the legacy `forkJoin` (already removed in T020; confirm removal)
- [x] T030 [P] [US3] Write unit test for chart auto-refresh in `apps/frontend/src/app/core/services/dashboard.service.spec.ts` — mock `HttpClient`, use `fakeAsync/tick` to advance 5 minutes, assert chart REST call is made and `chartOptions` signal is updated

**Checkpoint**: All 3 user stories complete. KPIs live (≤30s), feeds live (≤30s), chart auto-refreshes (≤5min). Full reactivity achieved.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Observability, error boundary hardening, and cleanup affecting all stories.

- [x] T031 [P] Add structured logger calls to `CreateSaleUseCase` event emission in `apps/backend/src/application/use-cases/sales/create-sale.use-case.ts` — log `[DashboardEvent] sale_completed emitted` at DEBUG level with `tenantId` and `saleId`; catch and log any `pushEvent` errors without rethrowing (fire-and-forget)
- [x] T032 [P] Add structured logger calls to `CreateMovementUseCase` event emission in `apps/backend/src/application/use-cases/inventory/create-movement.use-case.ts` — same pattern as T031, log `[DashboardEvent] stock_changed emitted`
- [x] T033 Remove the now-unused direct `SalesService`, `InventoryService`, and `ProductsService` injections from `apps/frontend/src/app/features/dashboard/dashboard.component.ts` if they are no longer called directly by the component (moved to `DashboardService`); confirm no other component in the dashboard feature tree depends on these services being injected at the parent level
- [x] T034 [P] Remove the dead `forkJoin` import from `apps/frontend/src/app/features/dashboard/dashboard.component.ts` if no longer used after T020 refactor
- [x] T035 [P] Add `DashboardService` and `DashboardEventType` to the module barrel exports at `apps/frontend/src/app/core/services/index.ts` (if such a barrel exists) or document the import path in a comment block at the top of `dashboard.service.ts` for discoverability
- [x] T036 [P] Verify that the `DashboardModule` backend controller is correctly prefixed under `/api/v1/` — check `apps/backend/src/main.ts` global prefix configuration and confirm `DashboardController` path resolves to `/api/v1/dashboard/snapshot` per the Constitution's API versioning rule

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)          ─── No dependencies — start immediately
    │
    ▼
Phase 2 (Foundational)   ─── Depends on Phase 1 (T001–T004)
    │                        BLOCKS all user story frontend work
    ▼
Phase 3 (US1 / P1)  ──────── Depends on Phase 1 + Phase 2
Phase 4 (US2 / P2)  ──────── Depends on Phase 3 (feeds use same DashboardService SSE handler)
Phase 5 (US3 / P3)  ──────── Depends on Phase 3 (DashboardService must exist)
    │
    ▼
Phase 6 (Polish)         ─── Depends on Phase 3 + 4 + 5
```

### Backend vs. Frontend Parallelism

Once Phase 1 is complete:
- **Backend developer** → can work on Phase 2 (T005–T009) immediately
- **Frontend developer** → must wait for Phase 2 to complete before starting T016

Once Phase 2 is complete:
- **Backend developer** → T010, T011, T012 (event emission) can be done in parallel with frontend work
- **Frontend developer** → T016, T017, T018, T019, T020, T021 (DashboardService + component refactor)

### Within User Story 1

```
T010 ──┐
T011 ──┼──► (backend done) ──► T016 ──► T017 ──► T018 ──► T019 ──► T020 ──► T021
T012 ──┘
T013 [P] ─┐
T014 [P] ─┼──► (tests — write before implementation tasks T010–T012)
T015 [P] ─┘
T022 [P] ─── (write before T016–T021)
```

---

## Parallel Execution Examples

### Phase 1 (all parallel)
```
Task T001 — backend shared event types
Task T002 — frontend model interfaces
Task T003 — wire OperationalStreamService into SalesModule
Task T004 — wire OperationalStreamService into InventoryModule
```

### Phase 3, US1 Backend (parallel group)
```
Task T010 — CreateSaleUseCase event emission
Task T011 — CompleteSaleUseCase event emission
Task T012 — CreateMovementUseCase event emission
```

### Phase 3, US1 Unit Tests (parallel group)
```
Task T013 — CreateSaleUseCase test
Task T014 — CompleteSaleUseCase test
Task T015 — CreateMovementUseCase test
Task T022 — DashboardService frontend test
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3 only — US1)

1. Complete **Phase 1**: Shared types + module wiring
2. Complete **Phase 2**: BFF snapshot endpoint
3. Complete **Phase 3**: Live KPI cards (backend emission + frontend DashboardService + component refactor)
4. **STOP & VALIDATE**: Open dashboard, complete a sale via POS, verify KPI cards update live
5. Merge to branch / demo to stakeholders

### Incremental Delivery

1. Phase 1 + 2 → Backend foundation ready
2. Phase 3 → **MVP**: Live KPIs + feeds (US1)
3. Phase 4 → Feed panel polish + type cleanup (US2)
4. Phase 5 → Chart auto-refresh (US3)
5. Phase 6 → Observability + cleanup

### Single Developer Sequence

```
T001 → T002–T004 [P] → T005 → T006 → T007 → T008 → T009
→ T010–T012 [P, backend emission]
→ T013–T015 [P, tests]
→ T016 → T017 → T018 → T019 → T020 → T021
→ T022 [P, frontend test]
→ T023 → T024 → T025–T026 [P]
→ T027 → T028 → T029 → T030 [P]
→ T031–T036 [P, polish]
```

**Total tasks**: 36 (T001–T036)

---

## Notes

- `[P]` = safely parallelizable; operates on distinct files with no dependency on an in-flight task
- `[USN]` = traceability to User Story N from spec.md
- Tests are included for new use cases and the `DashboardService` — mark complete only after tests pass
- No Prisma migrations required — all persistence uses existing schema
- The `DashboardService` MUST be provided at component scope (`providers: [DashboardService]` in the component decorator) — **NOT** in `root`, to ensure one service instance per dashboard tab and proper lifecycle management
- All `EventSource` connections must be closed in the service `ngOnDestroy` / `DestroyRef` callback to comply with Constitution Principle V (no resource leaks)
