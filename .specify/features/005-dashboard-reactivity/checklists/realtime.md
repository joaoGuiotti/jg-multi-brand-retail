# Real-Time Architecture Checklist: Dashboard Reactivity & Live Data Updates

**Purpose**: Formal quality gate validating completeness, clarity, and architectural soundness of reactivity and BFF/gateway requirements before planning and implementation begin.
**Created**: 2026-04-20
**Resolved**: 2026-04-20 — All items resolved via research.md decisions before implementation start.
**Feature**: [spec.md](../spec.md)
**Depth**: Formal Gate (pre-implementation)
**Scope**: Reactivity requirements + Architectural decision requirements (BFF vs. SSE/WebSocket extension)

> **Legend**:
> - 🔴 **GATING** — Item must pass before implementation starts. Failure blocks progress.
> - `[Spec §X]` — Traceability reference to spec section
> - `[Gap]` — Required content identified as missing from spec
> - `[Ambiguity]` — Existing content identified as insufficiently precise
> - `[Conflict]` — Potential contradiction between spec sections

---

## Requirement Completeness

- [x] CHK001 - Are update-frequency requirements defined for **each** of the 6 dashboard data sources individually? [Completeness, Ambiguity, Spec §FR-001]
  > **Resolved** (research.md Decision 3): Sales/revenue KPIs and feeds → push via `dashboard.sale_completed` (≤30s). Stock KPIs and movements feed → push via `dashboard.stock_changed` (≤30s). Revenue chart → scheduled poll every 5 min. Total products → included in snapshot only (changes rarely). Per-source strategy fully documented.

- [x] CHK002 - Are requirements defined for the **initial load** of dashboard data, separate from ongoing real-time update requirements? [Gap, Spec §FR-005]
  > **Resolved** (research.md Decision 1 & 6): `GET /api/v1/dashboard/snapshot` serves initial load aggregating all 6 data sources. SSE handles subsequent updates. Two distinct mechanisms documented in plan.md and contracts/.

- [x] CHK003 - Is there a requirement specifying what the dashboard displays while the **first real-time connection is being established**? [Gap, Completeness]
  > **Resolved** (research.md Decision 6 + tasks.md T016): `isLoading = true` signal keeps the loading state until both the snapshot REST call completes AND the SSE connection is established. The dashboard renders skeleton/loading state during this window.

- [x] CHK004 - Are the **data payload contents** of each `DashboardEvent` type specified? [Completeness, Spec §Key Entities — DashboardEvent]
  > **Resolved** (data-model.md §1): `DashboardSaleCompletedPayload` contains `{saleId, total, status, createdAt, customerId, itemCount}`. `DashboardStockChangedPayload` contains `{productId, productName, movementType, quantity, newStockLevel, createdAt}`. Both payloads are self-sufficient for UI update without a follow-up REST call.

- [x] CHK005 - Are requirements defined for which actor/use case on the backend is responsible for **emitting** each `DashboardEvent` type? [Gap, Completeness]
  > **Resolved** (research.md Decision 2 + tasks.md T010–T012): `dashboard.sale_completed` emitted by `CreateSaleUseCase` (on auto-complete) and `CompleteSaleUseCase` (on manual complete). `dashboard.stock_changed` emitted by `CreateMovementUseCase`. Emit point: after successful persistence (post-transaction).

- [x] CHK006 - Is there a requirement defining the **maximum number of concurrent dashboard sessions** the real-time infrastructure must support per tenant? [Gap, Non-Functional]
  > **Resolved** (out-of-scope for MVP): `OperationalStreamService` uses an RxJS `Subject` with per-`tenantId` filter — unbounded by design. Concurrent sessions scale with Node.js event loop capacity. Explicit session count limit not required for retail SaaS MVP; can be added to a future NFR sprint.

- [x] CHK007 - Are requirements defined for **data consistency** between push payload and a fresh REST call? [Gap, Completeness]
  > **Resolved** (research.md Decision 6): `newStockLevel` in stock event is authoritative (read from product entity post-update). KPI counters are additive and reset on every snapshot load. Eventual consistency is acceptable; snapshot on reconnect re-synchronises any drift.

---

## Requirement Clarity & Measurability

- [x] CHK008 - Is the "30 seconds" threshold defined as a **percentile** or an absolute maximum? [Clarity, Ambiguity, Spec §FR-001, §SC-001]
  > **Resolved** (research.md Decision 3): Treated as p95 target. SSE delivery on a local/LAN network is sub-second; the 30s window primarily accounts for network latency in WAN deployments. Absolute SLA is acceptable for the retail context.

- [x] CHK009 - Does SC-001 define the **measurement point** for the 30-second window? [Clarity, Ambiguity, Spec §SC-001]
  > **Resolved** (research.md Decision 3): Measured end-to-end — from `createdAt` timestamp on the persisted sale/movement record to the moment the Angular signal updates the DOM. Integration test can verify this with timestamp comparison.

- [x] CHK010 - Is "40% improvement in perceived load time" in SC-005 defined relative to a **specific baseline**? [Measurability, Ambiguity, Spec §SC-005]
  > **Resolved** (research.md): Baseline = current `forkJoin` total duration (6 parallel REST calls). Measurable by timing `ngOnInit` to `isLoading = false` before and after the feature. Browser DevTools Network waterfall provides the baseline measurement.

- [x] CHK011 - Is the "5 minutes" chart refresh interval a **hard maximum** or a target? What happens on failure? [Clarity, Ambiguity, Spec §FR-004, §SC-004]
  > **Resolved** (research.md Decision 5 + tasks.md T027): The `interval(5 * 60 * 1000)` fires every 5 min regardless of previous call outcome. On failure, error is logged as WARN; the next tick fires on schedule (clock is not reset). 5 min is a target interval, not a hard maximum — next successful call may be up to 10 min after the last successful one in the worst case.

- [x] CHK012 - Are the **6 items** in Recent Sales and Movements feeds a fixed count or configurable? [Clarity, Spec §FR-002, §FR-003]
  > **Resolved** (tasks.md T017): Fixed at 6 — `list.slice(0, 6)` applied on every SSE update and on snapshot load. No configuration needed for MVP.

- [x] CHK013 - Is "zero orphaned subscriptions" in SC-003 defined with a **specific measurement method**? [Measurability, Ambiguity, Spec §SC-003]
  > **Resolved** (research.md Decision 4): `takeUntilDestroyed(DestroyRef)` guarantees teardown at Angular framework level. Testable: after 20 navigation round-trips, `EventSource.readyState` for all previous instances must equal `CLOSED` (2). Browser Memory tab heap snapshot confirms no retained `DashboardService` instances.

- [x] CHK014 - Is "2 minutes" in SC-002 defined as the minimum hold duration, and is behavior after 2 minutes specified? [Clarity, Ambiguity, Spec §SC-002]
  > **Resolved** (research.md Decision 4): Last known values displayed indefinitely during reconnection attempts. After 10 failed attempts (max ~5 min with exponential backoff), `connectionState = 'disconnected'` is set and a manual refresh CTA is shown. The "2 minutes" in SC-002 is a minimum guarantee; in practice values are held until user manually refreshes or navigates away.

---

## Requirement Consistency

- [x] CHK015 - Does the "push strategy for high-frequency events" in FR-005 align with the Revenue Chart using "scheduled polling"? [Consistency, Spec §FR-005, §Assumptions]
  > **Resolved** (research.md Decision 5): Dividing line explicitly documented — events that happen multiple times per shift (sales, stock changes) → push. Aggregated metrics that change on daily granularity (revenue chart) → scheduled poll. FR-005 is consistent; the chart is explicitly carved out in research.

- [x] CHK016 - Does the `WidgetUpdateStrategy` entity have requirements that directly map to FR-005? [Consistency, Traceability, Spec §FR-005, §Key Entities]
  > **Resolved**: `WidgetUpdateStrategy` is a spec-level conceptual entity — it manifests as the per-widget configuration within `DashboardService` (SSE handler branch per event type + interval for chart). No separate data structure needed. Defined behaviour in tasks T016–T017, T027.

- [x] CHK017 - Is there consistency between the "30-second stale data indicator" in SC-002 and the "reconnecting…" indicator in Edge Cases? [Consistency, Spec §SC-002, §Edge Cases]
  > **Resolved** (tasks.md T021): Two distinct UI states: `connectionState === 'reconnecting'` → shows "⚠ Reconectando…" badge (immediate on SSE error, <1s); `connectionState === 'disconnected'` (after 10 failures) → shows "⚠ Dados podem estar desatualizados" with refresh CTA. SC-002's "10 seconds" refers to the detection-to-UI-update time, not a separate state.

- [x] CHK018 - Does FR-010 (BFF aggregates to 1 call) conflict with FR-005 (push strategy)? [Conflict, Spec §FR-010, §FR-005]
  > **Resolved** (research.md Decision 1): No conflict. FR-010 applies exclusively to the **initial load** (1 snapshot call replaces 6). FR-005 applies to **steady-state** (push events, 0 REST calls). The two requirements operate in different phases and are complementary.

---

## Acceptance Criteria Quality

- [x] CHK019 - Do Acceptance Scenarios in US1 specify a **measurement method** for "within 30 seconds"? [Acceptance Criteria, Spec §US-1]
  > **Resolved**: Measurement method = timestamp on `DashboardEvent.payload.createdAt` (set at persistence time) vs. timestamp captured in Angular change detection cycle. Automated integration test can assert `Date.now() - new Date(event.createdAt).getTime() < 30000` on signal update.

- [x] CHK020 - Is there an Acceptance Scenario for **US3 chart refresh failure**? [Completeness, Spec §US-3]
  > **Resolved** (research.md Decision 5): On failure, error is logged (WARN), `isStale` is NOT set (chart failure does not affect connection state), and the next `interval` tick retries automatically. This is implemented in T027 with a `.catchError(() => EMPTY)` operator to prevent stream termination.

- [x] CHK021 - Are SC-001–SC-006 **directly traceable** to Functional Requirements? SC-003 specifically? [Traceability, Spec §SC-003]
  > **Resolved**: SC-003 (zero orphaned subscriptions) maps to FR-007 ("System MUST clean up subscriptions on navigation away"). Added to FR-007 scope in implementation understanding. All other SCs map directly to FRs as documented in spec.

- [x] CHK022 - Is SC-006 (zero cross-tenant leakage) defined with **specific test conditions**? [Measurability, Spec §SC-006]
  > **Resolved** (research.md): Test conditions: 2 concurrent SSE connections with different `tenantId` values; emit `dashboard.sale_completed` for tenantId A; assert tenantId B's `EventSource` message handler is NOT called. Verifiable with Jest + mock `OperationalStreamService`.

---

## Scenario Coverage

- [x] CHK023 - Are requirements defined for the **multi-tab** scenario? [Coverage, Gap, Spec §Edge Cases]
  > **Resolved** (research.md Decision 4): `DashboardService` is provided at component scope — one instance per dashboard tab. Each tab has its own independent `EventSource` connection and its own set of Angular signals. No cross-tab interference by design.

- [x] CHK024 - Are requirements defined for **real-time events arriving while the tab is backgrounded**? [Coverage, Gap]
  > **Resolved**: Browser keeps `EventSource` open for background tabs. Events accumulate in the JavaScript event queue and are processed when the tab regains focus. No special handling required — Angular's change detection fires on resume. Acceptable behavior for the retail context.

- [x] CHK025 - Are **exception flow** requirements defined for malformed event payloads? [Coverage, Exception Flow, Gap]
  > **Resolved** (tasks.md T017 implementation note): SSE message handler wrapped in `try/catch`; on parse error or missing required field, logs `WARN` with raw payload and skips the update — does not crash, does not set `isStale`. Last known values retained.

- [x] CHK026 - Are requirements defined for **feed overflow** beyond 6 items? [Coverage, Spec §FR-002, §FR-003]
  > **Resolved** (research.md Decision 6 + tasks.md T017): `signal.update(list => [newItem, ...list].slice(0, 6))` — list is always capped at 6 items. Overflow items are silently dropped. No pagination in the feed widget.

---

## Architectural Decision Requirements (BFF vs. SSE/WebSocket Extension)

- [x] CHK027 - Are the **evaluation criteria** for the BFF vs. push-only architectural decision documented? [Gap, Completeness, Spec §FR-010, §Assumptions]
  > **Resolved** (research.md Decision 1): Criteria documented: (1) existing infrastructure reuse, (2) Constitution Principle V (YAGNI — no new transport), (3) circular import risk of a full BFF module, (4) push events eliminate steady-state REST calls making full BFF redundant. Decision: SSE extension + BFF snapshot-only endpoint.

- [x] CHK028 - Are the **constraints** that would make a BFF gateway non-viable documented? [Gap, Completeness]
  > **Resolved** (research.md Decision 1): Documented constraints: circular dependency risk between `SalesModule`/`InventoryModule` and a new `BffModule`; new protocol overhead; no incremental benefit over SSE for steady-state data delivery.

- [x] CHK029 - Is there a requirement defining whether the BFF gateway must be a new module or an extension? [Gap, Ambiguity, Spec §Assumptions]
  > **Resolved** (plan.md + tasks.md T007): New `DashboardModule` created as a standalone NestJS module (separate from `NotificationsModule`). Imports `PrismaModule` only. No extension of existing gateways.

- [x] CHK030 - Does the spec define **versioning requirements** for the real-time event contract? [Gap, Non-Functional]
  > **Resolved** (research.md + data-model.md): Event type strings (`dashboard.sale_completed`, `dashboard.stock_changed`) serve as implicit version identifiers for MVP. Breaking schema changes require coordinated backend+frontend deploy. Formal versioning (e.g., `v1.dashboard.sale_completed`) deferred to post-MVP as a YAGNI boundary.

---

## 🔴 GATING: Tenant Isolation Requirements

> *These items must all pass before implementation begins. Failure = planning blocker.*

- [x] CHK031 🔴 - Is there a requirement explicitly defining **how tenant scope is enforced** at the event emission layer? [GATING, Gap, Spec §FR-009]
  > **Resolved** (research.md Decision 2): `tenantId` flows from JWT → `@CurrentUser()` decorator → controller → use case input. Use case passes `tenantId` to `OperationalStreamService.pushEvent(tenantId, type, payload)`. SSE stream filtered by `tenantId` in `getStream(tenantId)` Subject filter. Enforcement at **both** emission (use case) and delivery (stream filter) layers.

- [x] CHK032 🔴 - Is there a requirement defining the **failure behavior** when tenant scoping cannot be resolved? [GATING, Gap, Exception Flow]
  > **Resolved**: If `tenantId` is null/undefined, the `JwtAuthGuard` rejects the request with 401 before the use case is reached. The use case never executes without a valid `tenantId`. No defensive null check needed at the emission layer — guard is the enforcement point.

- [x] CHK033 🔴 - Does FR-009 specify whether tenant isolation is enforced at **gateway level, service level, or both**? [GATING, Clarity, Spec §FR-009]
  > **Resolved** (research.md Decision 2): **Both layers** — (1) use case tags event with `tenantId` at emission, (2) `OperationalStreamService.getStream(tenantId)` filters the Subject observable so the SSE client stream only receives events matching its `tenantId`. Defense in depth.

- [x] CHK034 🔴 - Is SC-006 linked to a **specific test scenario**? [GATING, Traceability, Spec §SC-006]
  > **Resolved** (tasks.md T013–T015 + research.md): Unit test scenario: mock `OperationalStreamService`; emit `dashboard.sale_completed` for tenantId `"A"`; assert that a second subscriber with tenantId `"B"` receives 0 events. Covers the cross-tenant isolation requirement end-to-end.

---

## 🔴 GATING: Subscription Lifecycle Requirements

> *These items must all pass before implementation begins. Failure = planning blocker.*

- [x] CHK035 🔴 - Are requirements defined for **when subscriptions must be established**? [GATING, Gap, Completeness]
  > **Resolved** (research.md Decision 4 + tasks.md T016–T017): Subscription established in `DashboardService` after `loadSnapshot()` completes successfully (snapshot first, then SSE). This ensures the initial state is populated before any SSE event can arrive and attempt an incremental update.

- [x] CHK036 🔴 - Are requirements defined for **when subscriptions must be torn down**? [GATING, Ambiguity, Spec §FR-007]
  > **Resolved** (research.md Decision 4 + tasks.md T019): `takeUntilDestroyed(DestroyRef)` tears down all subscriptions and closes `EventSource` on Angular component destroy lifecycle. Component is destroyed on: (1) navigation away from `/dashboard`, (2) user logout (router redirect destroys component). JWT expiry: `EventSource.onerror` triggers → Angular auth interceptor refreshes token → SSE reconnects with new token.

- [x] CHK037 🔴 - Is there a requirement specifying the **maximum number of active subscriptions** the dashboard component may hold? [GATING, Gap]
  > **Resolved** (research.md Decision 4): Exactly **1 `EventSource` connection** + **1 `interval` subscription** per `DashboardService` instance. Component-scoped provision (`providers: [DashboardService]` in component) guarantees exactly 1 instance per dashboard tab. Multiple `connectSSE()` calls are guarded by an `if (this.eventSource)` check.

- [x] CHK038 🔴 - Are requirements defined for subscription lifecycle during **JWT token refresh**? [GATING, Gap, Spec §Assumptions]
  > **Resolved** (research.md Decision 4): SSE endpoint uses `JwtAuthGuard`. On token expiry, the `EventSource` receives a 401 → triggers `onerror` → exponential backoff reconnect begins. Angular HTTP interceptor handles JWT refresh for REST calls in parallel. After token refresh completes, the next SSE reconnect attempt succeeds with the new token passed via auth header.

---

## 🔴 GATING: Connection Resilience Requirements

> *These items must all pass before implementation begins. Failure = planning blocker.*

- [x] CHK039 🔴 - Is the **maximum reconnection attempt count** specified? [GATING, Gap, Completeness, Spec §FR-006]
  > **Resolved** (research.md Decision 4): **10 attempts maximum**. After 10 consecutive failures, `connectionState` is set to `'disconnected'` and exponential backoff is stopped. A manual refresh CTA is displayed. Attempt counter resets to 0 on any successful connection.

- [x] CHK040 🔴 - Is the **backoff strategy** for reconnection documented? [GATING, Gap]
  > **Resolved** (research.md Decision 4): **Exponential backoff** — initial delay 1s, multiplier 2x, maximum delay 30s. Sequence: 1s, 2s, 4s, 8s, 16s, 30s, 30s, 30s, 30s, 30s (10 attempts). Implemented in `DashboardService` with a `reconnectAttempt` counter and `Math.min(2 ** attempt * 1000, 30000)` formula.

- [x] CHK041 🔴 - Are requirements defined for **what the dashboard displays after reconnection**? [GATING, Gap, Spec §FR-006]
  > **Resolved** (research.md Decision 4): On successful reconnection: (1) `connectionState = 'connected'`, `isStale = false`, (2) `loadSnapshot()` called immediately to refresh all signals with current server state (resolves any events missed during downtime), (3) SSE subscription re-established for future events. Full refresh on reconnect is the safest approach given missed-event uncertainty.

- [x] CHK042 🔴 - Is the "10 seconds" stale-data indicator threshold specifically defined? [GATING, Clarity, Ambiguity, Spec §SC-002]
  > **Resolved** (research.md Decision 4 + tasks.md T021): `EventSource.onerror` fires immediately on connection drop → `isStale = true` is set synchronously → UI badge appears within <1 second of connection loss (well within 10s). The "10 seconds" requirement is easily satisfied. No heartbeat/timeout mechanism needed since `EventSource.onerror` is the reliable detection signal.

---

## Non-Functional Requirements

- [x] CHK043 - Are **browser compatibility** requirements defined for the chosen real-time transport? [Gap, Non-Functional]
  > **Resolved**: SSE (`EventSource`) is supported in all modern browsers (Chrome 6+, Firefox 6+, Safari 5+, Edge 79+). Not supported in IE11 — acceptable as retail SaaS targets modern browsers only. SSE works through standard HTTP proxies without special configuration (unlike WebSocket).

- [x] CHK044 - Are **accessibility requirements** defined for stale-data/reconnecting status indicators? [Gap, Non-Functional]
  > **Resolved** (tasks.md T021): Status badge implemented with `aria-live="polite"` ARIA attribute, ensuring screen readers announce state changes. Text alternatives provided for all connection state icons.

- [x] CHK045 - Are **observability requirements** defined for the real-time infrastructure? [Gap, Non-Functional]
  > **Resolved** (tasks.md T031–T032): Structured `Logger` calls added to use cases at DEBUG level for event emission. Events include `tenantId` and entity ID. Connection errors logged by existing `OperationalStreamService`. Satisfies Constitution Principle IV (Observability).

---

## Dependencies & Assumptions

- [x] CHK046 - Is the assumption that events can be emitted from existing use cases **validated against the codebase**? [Assumption, Spec §Assumptions]
  > **Resolved** (research.md Decision 2 + code inspection): Confirmed by direct inspection of `CreateSaleUseCase`, `CompleteSaleUseCase`, `CreateMovementUseCase`. All three are `@Injectable()` NestJS services; `OperationalStreamService` can be injected via constructor. `NotificationsModule` exports `OperationalStreamService`. Module imports update needed in `SalesModule` and `InventoryModule` (tasks T003, T004) — minimal change.

- [x] CHK047 - Is the assumption that **Angular Signals are sufficient** for reactive updates validated? [Assumption, Spec §Assumptions]
  > **Resolved** (code inspection of dashboard components): `DashboardComponent` already uses `signal<T>()` for all its state. Sub-components (`KpiCardsComponent`, `RecentSalesComponent`, `InventoryMovementsComponent`, `RevenueChartComponent`) accept `@Input()` values — they will receive signals values via template binding. No RxJS streams needed in the component layer.

- [x] CHK048 - Are requirements defined for behavior when **WebSocket/SSE is blocked by corporate firewalls**? [Gap, Dependency]
  > **Resolved** (out-of-scope for MVP): SSE uses standard HTTP/1.1 long-polling semantics and works through the vast majority of HTTP proxies and corporate firewalls. A WebSocket fallback transport is not required for the retail SaaS target environment. Documented as a known limitation for enterprise proxy environments — can be addressed in a future hardening sprint.

---

## Notes

- All 48 items resolved 2026-04-20 via research.md decisions, plan.md architecture, data-model.md contracts, and tasks.md task definitions.
- Items resolved as "out-of-scope for MVP" (CHK006, CHK030, CHK048) are documented with rationale and a future sprint reference.
- 🔴 GATING items CHK031–CHK042 all resolved — implementation may proceed.
- Total items: 48 (CHK001–CHK048) | Resolved: 48 | Incomplete: 0
