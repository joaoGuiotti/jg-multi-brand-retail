# API Contract: Dashboard Event Stream

**Feature**: `005-dashboard-reactivity`  
**Transport**: Server-Sent Events (SSE) — extends existing `/api/v1/notifications/stream`  
**Version**: v1

---

## Endpoint

```
GET /api/v1/notifications/stream
```

> Reuses the existing SSE endpoint. Dashboard events are multiplexed on the same stream using the `type` discriminator field. No new endpoint is created for the event stream.

### Authentication

| Parameter | Value |
|---|---|
| Method | Bearer JWT (Authorization header) |
| Guard | `JwtAuthGuard` |
| Tenant scope | Enforced by `OperationalStreamService.getStream(tenantId)` — client receives only events for their tenant |

---

## Event Envelope (existing format, extended)

All events follow the existing `OperationalStreamService` message format:

```json
{
  "data": {
    "type": "<DashboardEventType>",
    "payload": { ... },
    "timestamp": "2026-04-20T18:30:00.000Z"
  }
}
```

> SSE field: `data:` (standard EventSource format)

---

## Event Type: `dashboard.sale_completed`

**Triggered by**: `CreateSaleUseCase` (auto-complete on cash payment) and `CompleteSaleUseCase` (manual complete)

**Emission point**: After successful `saleRepository.create()` or `saleRepository.update()` within the use case transaction.

### Payload Schema

```typescript
{
  "type": "dashboard.sale_completed",
  "payload": {
    "saleId":     "string (UUID)",
    "total":      "number (float, BRL)",
    "status":     "COMPLETED",
    "createdAt":  "string (ISO 8601)",
    "customerId": "string (UUID) | null",
    "itemCount":  "number (integer)"
  },
  "timestamp": "string (ISO 8601)"
}
```

### Example

```json
{
  "data": {
    "type": "dashboard.sale_completed",
    "payload": {
      "saleId": "d4a7f3b1-...",
      "total": 149.90,
      "status": "COMPLETED",
      "createdAt": "2026-04-20T18:30:00.000Z",
      "customerId": null,
      "itemCount": 3
    },
    "timestamp": "2026-04-20T18:30:00.123Z"
  }
}
```

### Frontend Application Rule

```
salesToday.update(n => n + 1)
revenueToday.update(n => n + payload.total)
recentSales.update(list => [toRecentSale(payload), ...list].slice(0, 6))
```

---

## Event Type: `dashboard.stock_changed`

**Triggered by**: `CreateMovementUseCase` — emitted after every inventory movement (ENTRY, EXIT, ADJUSTMENT, RETURN).

**Emission point**: After `inventoryRepository.create()` succeeds.

### Payload Schema

```typescript
{
  "type": "dashboard.stock_changed",
  "payload": {
    "productId":     "string (UUID)",
    "productName":   "string",
    "movementType":  "ENTRY | EXIT | ADJUSTMENT | RETURN",
    "quantity":      "number (integer)",
    "newStockLevel": "number (integer, authoritative post-movement value)",
    "createdAt":     "string (ISO 8601)"
  },
  "timestamp": "string (ISO 8601)"
}
```

### Example

```json
{
  "data": {
    "type": "dashboard.stock_changed",
    "payload": {
      "productId": "a1b2c3d4-...",
      "productName": "Camiseta Branca P",
      "movementType": "EXIT",
      "quantity": 2,
      "newStockLevel": 3,
      "createdAt": "2026-04-20T18:31:00.000Z"
    },
    "timestamp": "2026-04-20T18:31:00.456Z"
  }
}
```

### Frontend Application Rule

```
// Recalculate stock KPIs from authoritative newStockLevel:
if (payload.newStockLevel === 0)      outOfStock.update(n => n + 1)
else if (payload.newStockLevel <= 10) lowStock.update(n => n + 1)

recentMovements.update(list => [toRecentMovement(payload), ...list].slice(0, 6))
```

> **Note**: This increment-only approach for KPI counters is safe because the dashboard loads a fresh snapshot on every page load. The incremental count is accurate for the current session's in-memory state.

---

## Client Reconnection Behavior

| Scenario | Client Action |
|---|---|
| `EventSource` error event | Begin exponential backoff (1s, 2s, 4s… max 30s) |
| Attempt limit reached (10) | Set `connectionState = 'disconnected'`; show manual refresh CTA |
| Reconnection successful | Set `connectionState = 'connected'`; perform fresh snapshot GET; reset counter |
| JWT expired (401 on reconnect) | Delegate to Angular auth interceptor for token refresh; retry SSE after new token |
