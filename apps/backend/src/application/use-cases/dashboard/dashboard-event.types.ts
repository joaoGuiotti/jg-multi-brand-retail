import { Injectable } from '@nestjs/common';

// ─── Dashboard Event Types ───────────────────────────────────────────────────

export enum DashboardEventType {
  SALE_COMPLETED = 'dashboard.sale_completed',
  STOCK_CHANGED = 'dashboard.stock_changed',
}

// ─── Event Payloads ──────────────────────────────────────────────────────────

export interface DashboardSaleCompletedPayload {
  saleId: string;
  total: number;
  status: 'COMPLETED';
  createdAt: string; // ISO 8601
  customerId: string | null;
  itemCount: number;
}

export interface DashboardStockChangedPayload {
  productId: string;
  productName: string;
  movementType: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  newStockLevel: number; // authoritative post-movement stock level
  createdAt: string; // ISO 8601
}

// ─── Event Envelope ───────────────────────────────────────────────────────────

export type DashboardEventPayload =
  | DashboardSaleCompletedPayload
  | DashboardStockChangedPayload;
