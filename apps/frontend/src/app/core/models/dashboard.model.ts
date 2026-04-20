// ─── BFF Snapshot Response ────────────────────────────────────────────────────

export interface DashboardRecentSale {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  customerId: string | null;
}

export interface DashboardRecentMovement {
  id: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  createdAt: string;
}

export interface DashboardDailyRevenue {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface DashboardKpis {
  revenueToday: number;
  salesToday: number;
  lowStock: number;
  outOfStock: number;
  totalProducts: number;
}

export interface DashboardSnapshotResponse {
  kpis: DashboardKpis;
  recentSales: DashboardRecentSale[];
  recentMovements: DashboardRecentMovement[];
  dailyRevenue: DashboardDailyRevenue[];
}

// ─── SSE Event Payloads (mirrored from backend) ───────────────────────────────

export type DashboardEventType =
  | 'dashboard.sale_completed'
  | 'dashboard.stock_changed';

export interface DashboardSaleCompletedPayload {
  saleId: string;
  total: number;
  status: 'COMPLETED';
  createdAt: string;
  customerId: string | null;
  itemCount: number;
}

export interface DashboardStockChangedPayload {
  productId: string;
  productName: string;
  movementType: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  newStockLevel: number;
  createdAt: string;
}

export type DashboardEventPayload =
  | DashboardSaleCompletedPayload
  | DashboardStockChangedPayload;

export interface DashboardSseEvent {
  type: DashboardEventType;
  payload: DashboardEventPayload;
  timestamp: string;
}

export type DashboardConnectionState =
  | 'connected'
  | 'reconnecting'
  | 'disconnected';
