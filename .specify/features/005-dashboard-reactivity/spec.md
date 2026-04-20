# Feature Specification: Dashboard Reactivity & Real-Time Data Updates

**Feature Branch**: `005-dashboard-reactivity`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "analisar rota dashboard e quais endpoints são utilizados para manter a tela ativa, existe a necessidade de deixala reativa, analisar melhor plano para atualizar os dados em tela para cada endpoint. Necessidade de novo gateway BFF para dashboard"

---

## Context & Background

The dashboard currently loads all its data once on initialization via 6 parallel REST API calls and never refreshes on its own. This means that operators looking at the dashboard all day see stale KPIs, outdated revenue charts, and missed inventory alerts unless they manually reload the page.

The goal of this feature is to make the dashboard **live**: each widget automatically reflects the latest data from the server without any user interaction, using a push-based or efficient pull-based strategy per endpoint, according to how frequently and critically that data changes.

Additionally, this feature evaluates whether a **dedicated Backend-for-Frontend (BFF) gateway** for the dashboard is needed, or whether extending the existing real-time infrastructure (SSE + WebSocket) is a better fit.

---

## Dashboard Endpoint Inventory

The following endpoints are used today to populate the dashboard on load:

| Widget | Endpoint | Method | Data |
|---|---|---|---|
| KPI – Sales & Revenue Today | `GET /sales?page=1&limit=100&startDate={today}` | REST | Completed sales count + revenue sum for today |
| KPI – Recent Sales | `GET /sales?page=1&limit=6` | REST | Last 6 sales |
| KPI – Stock Summary | `GET /inventory/summary` | REST | Low stock count, out-of-stock count, total products |
| KPI – Total Products | `GET /products?page=1&limit=1` | REST | Meta total from products list |
| Recent Movements | `GET /inventory/movements?page=1&limit=6` | REST | Last 6 inventory movements |
| Revenue Chart (7d) | `GET /sales/reports/daily-revenue?days=7` | REST | Daily revenue series for the past 7 days |

**All 6 calls are made once in `ngOnInit` via `forkJoin` and never refreshed.**

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Live KPI Dashboard (Priority: P1)

An operator (cashier or manager) opens the dashboard and leaves it visible on a secondary monitor or wall display. Throughout the shift, new sales are registered via POS, inventory adjustments happen, and the KPI cards must reflect these changes automatically — without the operator needing to refresh.

**Why this priority**: This is the primary pain point. Stale KPIs on the main screen cause operational confusion (e.g., wrong revenue count at end of shift, unnoticed stock-out).

**Independent Test**: Open the dashboard, complete a new sale via POS, and verify the "Sales Today" and "Revenue Today" KPI cards update within an acceptable time window without any page reload.

**Acceptance Scenarios**:

1. **Given** the dashboard is open, **When** a new `COMPLETED` sale is registered in the system, **Then** the "Revenue Today" and "Sales Today" KPI cards update automatically within 30 seconds.
2. **Given** the dashboard is open, **When** an inventory adjustment creates a low-stock or out-of-stock condition, **Then** the "Low Stock" and "Out of Stock" KPI cards update automatically within 30 seconds.
3. **Given** the dashboard is open with no user interaction for 10 minutes, **Then** the KPI values displayed are no more than 30 seconds stale relative to the actual database state.

---

### User Story 2 – Live Recent Sales & Inventory Movements Feed (Priority: P2)

A manager monitoring the dashboard wants to see the latest sales and inventory movements appear in the feed panels without refreshing. New rows should appear at the top of the list as events occur.

**Why this priority**: Important for operational awareness but not blocking — the KPIs (P1) are more critical for decision-making. The feed panels are supplementary.

**Independent Test**: Open the dashboard, register a new sale or movement, and verify the corresponding feed panel updates automatically, showing the new entry at the top of the list.

**Acceptance Scenarios**:

1. **Given** the recent-sales feed is visible, **When** a new sale is created, **Then** it appears as the first row of the feed within 30 seconds, pushing older entries down.
2. **Given** the inventory-movements feed is visible, **When** a new stock movement is registered, **Then** it appears as the first row of the feed within 30 seconds.

---

### User Story 3 – Revenue Chart Auto-Refresh (Priority: P3)

The 7-day revenue area chart updates once per day (or at a configurable interval) so that the current day's bar grows as sales accumulate, without requiring a page reload.

**Why this priority**: The daily revenue chart changes on a longer time horizon. Real-time updates matter less here than for instant KPIs, making this a lower priority enhancement.

**Independent Test**: Open the dashboard at any time of day, register several sales, and verify the "today" column on the revenue chart reflects the accumulated revenue at least once every 5 minutes.

**Acceptance Scenarios**:

1. **Given** the revenue chart is displayed, **When** new sales push total daily revenue higher, **Then** the current-day bar on the chart updates to the new value within 5 minutes without a page reload.
2. **Given** a midnight boundary is crossed while the dashboard is open, **Then** the chart refreshes to include the new day and drop the oldest day automatically.

---

### Edge Cases

- What happens when the real-time connection (WebSocket or SSE) is lost due to network interruption? The dashboard must gracefully fall back to periodic polling or display a visible "reconnecting…" indicator, and resume live updates once the connection is restored.
- What happens if the server is temporarily unavailable during a data push? The UI must not crash or display corrupted data; it must retain the last known values and indicate the data may be stale.
- What happens when the user navigates away from the dashboard and returns? Subscriptions must be properly cancelled on leave and re-established on entry with a fresh initial load, preventing memory leaks.
- What happens when multiple dashboard tabs are open simultaneously? Each tab must receive its own independent stream without interfering with others.
- What happens when the tenant has zero sales today? KPI cards must display `0` values correctly, not show loading spinners indefinitely.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST automatically refresh "Sales Today", "Revenue Today", "Low Stock", "Out of Stock", and "Total Products" KPI values without requiring a page reload, within a maximum delay of 30 seconds after a relevant business event occurs.
- **FR-002**: The "Recent Sales" feed MUST automatically prepend new sales entries as they are created, without requiring a page reload, maintaining a maximum list size of 6.
- **FR-003**: The "Recent Inventory Movements" feed MUST automatically prepend new movement entries, without requiring a page reload, maintaining a maximum list size of 6.
- **FR-004**: The "7-Day Revenue" chart MUST refresh at minimum every 5 minutes to reflect accumulated daily revenue changes.
- **FR-005**: The system MUST support a data delivery mechanism (push or scheduled pull) that is appropriate for each data update frequency — high-frequency data (sales events, stock changes) should use a push strategy; low-frequency data (daily revenue chart) may use a scheduled refresh.
- **FR-006**: When the real-time connection is interrupted, the dashboard MUST display a user-visible indicator ("Reconnecting…" or "Data may be stale") and automatically attempt reconnection without requiring user interaction.
- **FR-007**: Upon navigation away from and back to the dashboard, the system MUST cleanly tear down and re-establish all subscriptions, preventing memory leaks and duplicate event handling.
- **FR-008**: The backend MUST emit structured events (including event type, tenant scope, and payload) when sales are created/completed, and when stock levels change, so the dashboard can react to them.
- **FR-009**: The system MUST scope all real-time events to the authenticated user's tenant — one tenant's data must never be visible to another tenant's dashboard.
- **FR-010**: If a dedicated BFF dashboard gateway is introduced, it MUST aggregate dashboard data in a single request/subscription, reducing the number of individual service calls from 6 to 1 per polling cycle.

### Key Entities

- **DashboardSnapshot**: An aggregated view of all KPI data (today's sales count, revenue, stock summary, recent sales, recent movements, daily revenue series) scoped to a tenant. This may be a virtual entity served by a BFF aggregation layer rather than persisted storage.
- **DashboardEvent**: A real-time message emitted when a relevant business action occurs (new sale, stock change, inventory movement). Contains event type, tenant ID, and minimal payload needed to update the affected widget.
- **WidgetUpdateStrategy**: The configuration (push vs. scheduled pull, refresh interval) per widget type that governs how often and via which channel the dashboard data is refreshed.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: KPI cards (sales today, revenue today, low stock, out of stock) reflect the true database state within 30 seconds of any relevant business event occurring, measured end-to-end from event creation to UI update.
- **SC-002**: The dashboard remains functional and shows the last known values for at least 2 minutes during a backend connectivity interruption, with a visible stale-data indicator displayed within 10 seconds of connection loss.
- **SC-003**: Navigation away from and back to the dashboard results in zero orphaned subscriptions, verifiable by absence of memory growth over 20 round-trip navigations.
- **SC-004**: The revenue chart is never more than 5 minutes behind the current cumulative daily total, regardless of how long the dashboard has been open.
- **SC-005**: The number of distinct REST calls made per dashboard refresh cycle is reduced to 1 (or 0 for push-driven events) compared to the current 6 parallel calls, improving perceived load time by at least 40% on subsequent refreshes.
- **SC-006**: All real-time events are strictly tenant-scoped — a stress test with 2 simultaneous tenant sessions confirms zero cross-tenant data leakage.

---

## Assumptions

- The existing `OperationalStreamService` (SSE) and `NotificationsGateway` (WebSocket/Socket.IO) infrastructure provides the foundation for server-side event pushing and will be extended rather than replaced.
- High-frequency events (sales completed, inventory movements) are already emitted or can be emitted from existing use cases with minimal changes; the backend event emission is the entry point for reactivity.
- A BFF (Backend-for-Frontend) gateway for the dashboard is considered the preferred approach if the aggregation of 6 endpoints proves to carry significant overhead; if the push strategy alone is sufficient (i.e., the frontend reconstructs state from events), the BFF aggregation endpoint may be limited to the initial page load snapshot only.
- The dashboard is designed for single-tenant authenticated sessions; multi-tenant isolation is already enforced at the infrastructure level via tenant-scoped rooms/streams.
- Mobile/responsive support is out of scope for this reactivity feature — the focus is on behavioral correctness of real-time updates.
- The refresh strategy for the revenue chart (P3) will use scheduled polling (interval-based) rather than event-driven push, since chart data changes on a per-day granularity and does not require sub-second precision.
- Existing Angular signals (`signal()`) in the dashboard component are already a reactive primitive; the implementation will leverage them to propagate updates from the real-time layer to the template without major architectural changes.
