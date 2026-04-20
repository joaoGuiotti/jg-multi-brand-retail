# Data Model: Dashboard Reactivity

**Branch**: `005-dashboard-reactivity` | **Date**: 2026-04-20  
**Phase**: 1 — Design & Contracts

> **No new database tables or Prisma migrations are required.** All data is derived from existing `Sale`, `SaleItem`, `InventoryMovement`, and `Product` tables. This section describes the **application-layer data structures** (TypeScript interfaces) and **runtime state model** used by the new dashboard reactivity layer.

---

## 1. Shared Types (`libs/shared/` or scoped to feature)

### `DashboardEventType` (enum)

```typescript
export enum DashboardEventType {
  SALE_COMPLETED  = 'dashboard.sale_completed',
  STOCK_CHANGED   = 'dashboard.stock_changed',
}
```

### `DashboardSaleCompletedPayload`

Emitted by `CreateSaleUseCase` (when auto-completed by cash payment) and `CompleteSaleUseCase` (manual completion).

```typescript
export interface DashboardSaleCompletedPayload {
  saleId:     string;
  total:      number;       // final sale total in BRL cents or float
  status:     'COMPLETED';
  createdAt:  string;       // ISO 8601
  customerId: string | null;
  itemCount:  number;       // total quantity of items sold
}
```

### `DashboardStockChangedPayload`

Emitted by `CreateMovementUseCase` after each inventory movement that changes stock.

```typescript
export interface DashboardStockChangedPayload {
  productId:     string;
  productName:   string;
  movementType:  'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN';
  quantity:      number;
  newStockLevel: number;    // authoritative post-movement stock level
  createdAt:     string;    // ISO 8601
}
```

### `DashboardEvent` (envelope, matches `OperationalStreamService` format)

```typescript
export interface DashboardEvent {
  type:      DashboardEventType;
  payload:   DashboardSaleCompletedPayload | DashboardStockChangedPayload;
  timestamp: string;    // ISO 8601, set by OperationalStreamService
  tenantId:  string;    // enforced by OperationalStreamService filter
}
```

---

## 2. BFF Snapshot Response Shape

Returned by `GET /api/v1/dashboard/snapshot`. Aggregates the 6 existing REST calls server-side.

```typescript
export interface DashboardSnapshotResponse {
  kpis: {
    revenueToday:  number;   // sum of completed sale totals for today
    salesToday:    number;   // count of COMPLETED sales for today
    lowStock:      number;   // products with 1–10 units
    outOfStock:    number;   // products with 0 units
    totalProducts: number;   // total product count
  };
  recentSales: DashboardRecentSale[];       // last 6 completed/pending sales
  recentMovements: DashboardRecentMovement[]; // last 6 inventory movements
  dailyRevenue: DashboardDailyRevenue[];    // last 7 days (for chart)
}

export interface DashboardRecentSale {
  id:         string;
  total:      number;
  status:     string;
  createdAt:  string;
  itemCount:  number;
  customerId: string | null;
}

export interface DashboardRecentMovement {
  id:          string;
  productId:   string;
  productName: string;
  type:        string;
  quantity:    number;
  createdAt:   string;
}

export interface DashboardDailyRevenue {
  date:    string;   // YYYY-MM-DD
  revenue: number;
}
```

---

## 3. Frontend Runtime State Model

Managed by the new `DashboardService` using Angular Signals. These are **reactive signals**, not persisted data.

```typescript
// DashboardService (provided in component scope — NOT root)
readonly revenueToday    = signal<number>(0);
readonly salesToday      = signal<number>(0);
readonly lowStock        = signal<number>(0);
readonly outOfStock      = signal<number>(0);
readonly totalProducts   = signal<number>(0);
readonly recentSales     = signal<DashboardRecentSale[]>([]);
readonly recentMovements = signal<DashboardRecentMovement[]>([]);
readonly chartOptions    = signal<ApexCharts.ApexOptions | null>(null);
readonly isLoading       = signal<boolean>(true);
readonly isStale         = signal<boolean>(false);        // true when SSE disconnected
readonly connectionState = signal<'connected' | 'reconnecting' | 'disconnected'>('connected');
```

### State Transition Diagram

```
                    ┌─────────────────────────────────────────┐
                    │              DashboardService             │
                    │                                           │
  ngOnInit ────────►│  [1] GET /dashboard/snapshot             │
                    │      → populate all KPI/feed signals      │
                    │  [2] EventSource.open(/notifications/stream)│
                    │      → connectionState = 'connected'       │
                    │      isLoading = false                     │
                    └──────────────┬────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────────────┐
              │                    │                            │
    SSE event received      Network error              interval(5min)
              │             (onerror)                       │
   ┌──────────▼──────────┐  ┌─────▼───────────────┐  ┌────▼────────────┐
   │ dashboard.sale_      │  │ isStale = true       │  │ GET /sales/     │
   │ completed            │  │ connectionState =    │  │ reports/daily-  │
   │ → salesToday++       │  │ 'reconnecting'       │  │ revenue         │
   │ → revenueToday+=     │  │ exponential backoff  │  │ → chartOptions  │
   │ → recentSales        │  │ (1s→2s→4s…max 30s)  │  │   signal.set()  │
   │   .update(prepend,6) │  │ after 10 failures:   │  └────────────────┘
   └────────────────────┘  │ connectionState =    │
   ┌──────────────────────┐  │ 'disconnected'       │
   │ dashboard.stock_     │  └──────────────────────┘
   │ changed              │
   │ → recompute low/out  │
   │ → recentMovements    │
   │   .update(prepend,6) │
   └──────────────────────┘
```

---

## 4. Entity Relationships (no schema changes)

```
Sale ──< SaleItem         (existing — read for snapshot)
Product ──< InventoryMovement  (existing — read for snapshot + stock level in event)
```

No new Prisma models, no new migration files.
