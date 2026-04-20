# Research: Dashboard Reactivity & Real-Time Data Updates

**Branch**: `005-dashboard-reactivity` | **Date**: 2026-04-20  
**Phase**: 0 — Research & Decision Resolution

---

## Decision 1: BFF Gateway vs. SSE Extension

**Decision**: **Extend existing SSE infrastructure** (`OperationalStreamService`) for push events + introduce a **single BFF snapshot endpoint** only for the initial page load.

**Rationale**:
- The codebase already has a working `OperationalStreamService` (in-memory Subject-based SSE), `NotificationsGateway` (WebSocket via Socket.IO), and `NotificationsSseController` that push events to authenticated, tenant-scoped clients.
- For **steady-state reactivity** (after page load), adding an event emission call to `CreateSaleUseCase`, `CompleteSaleUseCase`, and `CreateMovementUseCase` is sufficient — the frontend reconstructs widget state from the event payload without additional REST calls. This eliminates the need for a BFF gateway in the hot path.
- For **initial page load**, a single `GET /api/v1/dashboard/snapshot` endpoint is introduced — aggregating the data from the 6 existing use cases server-side — reducing frontend REST calls from 6 to 1 (resolving FR-010, SC-005).
- A full BFF gateway (e.g., a dedicated NestJS gateway module with its own transport) would add infrastructure complexity (new module, new protocol) with no incremental benefit over SSE that the codebase cannot absorb without violating Constitution Principle V (YAGNI).

**Alternatives Considered**:
- **WebSocket (Socket.IO) only**: Already present via `NotificationsGateway`. Rejected as sole mechanism because SSE is simpler for unidirectional server-to-client push, has no socket handshake overhead, and works well through HTTP/2 proxies. WebSocket is better suited for bidirectional communication (like the existing `mark_as_read` flow).
- **Full BFF GraphQL/REST gateway**: Introduces a third application layer, new dependencies, and circular import risks between `SalesModule` and `InventoryModule`. Rejected per YAGNI.
- **Polling interval on all 6 endpoints**: Simple to implement but violates FR-005 (per-endpoint strategy), increases server load linearly with connected clients, and does not satisfy the 30-second SLA without creating extremely short polling intervals.

---

## Decision 2: Event Emission Point in the Backend

**Decision**: Emit `DashboardEvent` inside **use cases** (application layer), not in controllers or domain entities.

**Rationale**:
- The application use-case layer is where business side effects belong in Clean Architecture / DDD. The existing `NotificationEventsHandler` and `DomainEventPublisher` pattern confirms this.
- Emitting from the controller would couple transport-layer code to business logic. Emitting from domain entities would couple the domain to infrastructure dependencies.
- `OperationalStreamService` is already exported from `NotificationsModule` — it can be injected into `CreateSaleUseCase`, `CompleteSaleUseCase`, and `CreateMovementUseCase` after updating their respective module imports.

**Injection approach**:
```
SalesModule imports NotificationsModule → OperationalStreamService available
InventoryModule imports NotificationsModule → OperationalStreamService available
```

**Risk**: Circular dependency if NotificationsModule imports SalesModule or InventoryModule. **Confirmed safe**: `NotificationsModule` currently has no dependency on `SalesModule` or `InventoryModule`.

---

## Decision 3: Event Payload Structure

**Decision**: Use a **minimal delta payload** — each event type carries only the fields needed to update the affected widget(s) without requiring a follow-up REST call.

| Event Type | Triggered By | Payload Fields |
|---|---|---|
| `dashboard.sale_completed` | `CreateSaleUseCase` / `CompleteSaleUseCase` | `{ saleId, total, status, createdAt, customer, items[] }` |
| `dashboard.stock_changed` | `CreateMovementUseCase` | `{ productId, productName, type, quantity, newStockLevel, createdAt }` |

**Rationale**: The frontend can update KPI signals (`salesToday`, `revenueToday`, `lowStock`, `outOfStock`) and prepend to the feed signals (`recentSales`, `recentMovements`) entirely from the event payload — no follow-up REST call needed for the happy path. This keeps the push path stateless and low-latency.

**Stock thresholds**: Low stock = 1–10 units, out-of-stock = 0 units (matching existing `GetStockSummaryUseCase` logic: `gt: 0, lte: 10`). Frontend recalculates these counts locally by receiving the `newStockLevel` in the event.

---

## Decision 4: Connection Resilience & Subscription Lifecycle (Frontend)

**Decision**: Use **Angular's `EventSource` API** wrapped in an RxJS `Observable` with **exponential backoff** reconnection (initial 1s, max 30s, factor 2). Subscription managed via `takeUntilDestroyed()` (Angular 16+ DestroyRef pattern) to prevent leaks.

| Scenario | Behavior |
|---|---|
| Component init | Fresh snapshot REST call + SSE subscription established |
| Network loss detected (EventSource.onerror) | Display "⚠ Dados podem estar desatualizados" badge; begin exponential backoff reconnect |
| Reconnection successful | Clear badge; apply any events received since reconnect |
| Browser tab backgrounded | SSE stream continues (browser keeps EventSource open); no special handling |
| Component destroy (navigation away) | `takeUntilDestroyed()` unsubscribes; EventSource closed |
| User logout | Auth guard redirects; component destroyed; subscription cancelled |
| JWT token expiry (15 min TTL) | SSE endpoint protected by `JwtAuthGuard`; expired token causes 401 → service detects → schedules reconnect after token refresh |

**Maximum reconnect attempts**: 10 before entering "permanently disconnected" state (shows manual refresh CTA). Reset counter on successful connection.

---

## Decision 5: Revenue Chart Refresh Strategy (P3)

**Decision**: **Scheduled `setInterval` poll** every 5 minutes, isolated to the chart widget. Not event-driven.

**Rationale**: Daily revenue aggregates are computed via `GetDailyRevenueUseCase` which runs a DB aggregation query. Pushing a delta on each sale would require the backend to re-run this aggregation and push the full 7-day series on every sale event, which is expensive and unnecessary for a chart that changes slowly. Polling every 5 minutes is the right cost/freshness tradeoff for P3.

**Implementation**: `interval(5 * 60 * 1000)` + `startWith(0)` in `DashboardService`, merged with component destroy signal via `takeUntilDestroyed()`.

---

## Decision 6: Frontend State Reconstruction Model

**Decision**: The `DashboardService` maintains **derived in-memory signals** and applies incremental updates from SSE events, rather than triggering REST calls on each event.

```
Initial load (snapshot REST):   signals set from BFF response
SSE sale_completed event:       salesToday++, revenueToday += event.total, 
                                recentSales.update(prepend, keep top 6)
SSE stock_changed event:        recompute lowStock/outOfStock from newStockLevel thresholds,
                                recentMovements.update(prepend, keep top 6)
Chart poll (5-min interval):    REST call to /sales/reports/daily-revenue → chartOptions signal updated
```

**Conflict resolution**: If two events arrive out of order (unlikely with SSE sequential stream), the last received value wins — KPI counters are additive (increment-only for today's counts), so order does not affect correctness. Stock levels use the authoritative `newStockLevel` field, not a delta, making them idempotent.

---

## Resolved Checklist Gaps (from realtime.md)

| CHK# | Gap | Resolution |
|---|---|---|
| CHK001 | Per-endpoint update frequency | Decision 3: sale events for KPIs (30s), poll for chart (5min) |
| CHK002 | Initial load definition | Decision 2/6: Snapshot endpoint serves initial load; SSE serves updates |
| CHK004 | Event payload completeness | Decision 3: Minimal delta payload defined — no follow-up REST needed |
| CHK005 | Who emits events | Decision 2: Use-case layer emits after successful persistence |
| CHK008 | 30s as percentile vs. absolute | Treated as p95 target; events are SSE-delivered in-order, sub-second in LAN conditions |
| CHK031–CHK034 | Tenant isolation enforcement | `OperationalStreamService.getStream(tenantId)` filters at Subject subscription level; emission in use cases always includes `tenantId` from authenticated context |
| CHK035–CHK038 | Subscription lifecycle | `takeUntilDestroyed()` on component; DashboardService is non-singleton (provided in component) |
| CHK039–CHK042 | Connection resilience | Exponential backoff with 10-attempt limit; stale indicator at 10s; post-reconnect full snapshot |
