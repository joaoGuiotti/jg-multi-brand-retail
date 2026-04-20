# API Contract: Dashboard Snapshot Endpoint (BFF)

**Feature**: `005-dashboard-reactivity`  
**Transport**: HTTP REST  
**Version**: v1

---

## Endpoint

```
GET /api/v1/dashboard/snapshot
```

### Purpose

Replaces the 6 parallel REST calls made in the current `DashboardComponent.ngOnInit()` with a single server-side aggregated response. Used **only for initial page load**; subsequent updates come via the SSE event stream.

### Authentication

| Parameter | Value |
|---|---|
| Method | Bearer JWT (Authorization header) |
| Guard | `JwtAuthGuard + RolesGuard` |
| Roles | `[ADMIN, USER]` |
| Tenant scope | Auto-scoped via `@CurrentUser()` — `tenantId` from JWT claims |

---

## Request

```http
GET /api/v1/dashboard/snapshot
Authorization: Bearer <jwt-access-token>
```

No query parameters. No request body.

---

## Response: 200 OK

```typescript
{
  "data": {
    "kpis": {
      "revenueToday":  number,   // sum of `total` for COMPLETED sales where createdAt >= today 00:00 UTC
      "salesToday":    number,   // count of COMPLETED sales where createdAt >= today 00:00 UTC
      "lowStock":      number,   // product count where stockQuantity IN (1..10)
      "outOfStock":    number,   // product count where stockQuantity = 0
      "totalProducts": number    // total product count for tenant
    },
    "recentSales": [             // last 6 sales (any status), ordered by createdAt DESC
      {
        "id":         "string (UUID)",
        "total":      number,
        "status":     "PENDING | COMPLETED | CANCELLED",
        "createdAt":  "string (ISO 8601)",
        "customerId": "string (UUID) | null",
        "itemCount":  number
      }
    ],
    "recentMovements": [         // last 6 inventory movements, ordered by createdAt DESC
      {
        "id":          "string (UUID)",
        "productId":   "string (UUID)",
        "productName": "string",
        "type":        "ENTRY | EXIT | ADJUSTMENT | RETURN",
        "quantity":    number,
        "createdAt":   "string (ISO 8601)"
      }
    ],
    "dailyRevenue": [            // last 7 days, ordered chronologically (oldest first)
      {
        "date":    "string (YYYY-MM-DD)",
        "revenue": number
      }
    ]
  }
}
```

### Example Response

```json
{
  "data": {
    "kpis": {
      "revenueToday": 1250.00,
      "salesToday": 8,
      "lowStock": 3,
      "outOfStock": 1,
      "totalProducts": 42
    },
    "recentSales": [
      {
        "id": "d4a7f3b1-...",
        "total": 149.90,
        "status": "COMPLETED",
        "createdAt": "2026-04-20T18:30:00.000Z",
        "customerId": null,
        "itemCount": 3
      }
    ],
    "recentMovements": [
      {
        "id": "e5b8c2a3-...",
        "productId": "a1b2c3d4-...",
        "productName": "Camiseta Branca P",
        "type": "EXIT",
        "quantity": 2,
        "createdAt": "2026-04-20T18:31:00.000Z"
      }
    ],
    "dailyRevenue": [
      { "date": "2026-04-14", "revenue": 0 },
      { "date": "2026-04-15", "revenue": 320.50 },
      { "date": "2026-04-16", "revenue": 875.00 },
      { "date": "2026-04-17", "revenue": 1100.00 },
      { "date": "2026-04-18", "revenue": 450.75 },
      { "date": "2026-04-19", "revenue": 220.00 },
      { "date": "2026-04-20", "revenue": 1250.00 }
    ]
  }
}
```

---

## Error Responses

| Status | Condition | Body |
|---|---|---|
| 401 | Missing or expired JWT | `{ "statusCode": 401, "message": "Unauthorized" }` |
| 403 | Role not permitted | `{ "statusCode": 403, "message": "Forbidden" }` |
| 500 | Aggregation query failure | `{ "statusCode": 500, "message": "Internal server error" }` |

---

## Implementation Notes

- This endpoint is implemented in `GetDashboardSnapshotUseCase` which calls the existing use cases (`ListSalesUseCase`, `GetStockSummaryUseCase`, `ListMovementsUseCase`, `GetDailyRevenueUseCase`) or directly reuses their Prisma queries via `PrismaService`. No new SQL — reuses query patterns already proven in production.
- The response format wraps data in `{ "data": ... }` consistent with the existing `TransformInterceptor` applied globally in `AppModule`.
- `dailyRevenue` data is identical to what `GET /sales/reports/daily-revenue?days=7` currently returns — the snapshot includes it to eliminate that call on first load; the 5-minute chart poll still calls the original endpoint to keep the BFF endpoint stateless and cacheable.
