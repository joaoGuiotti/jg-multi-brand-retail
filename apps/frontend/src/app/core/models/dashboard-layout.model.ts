/**
 * Identifies each widget on the dashboard by a stable string key.
 * Add new IDs here when new widgets are introduced.
 */
export type WidgetId =
  | 'quick-actions'
  | 'kpi-cards'
  | 'revenue-chart'
  | 'recent-sales'
  | 'inventory-movements';

/**
 * Persisted layout configuration for a specific user.
 * Stored in localStorage (v1) or backend DB (v2).
 */
export interface DashboardLayout {
  /** ID of the user who owns this layout */
  userId: string;
  /** Tenant ID — ensures multi-tenant isolation in localStorage */
  tenantId: string;
  /**
   * Ordered array of widget IDs.
   * Index 0 = first widget rendered on the dashboard.
   * Must contain at least one valid WidgetId.
   */
  widgetOrder: WidgetId[];
  /** ISO 8601 timestamp of the last save */
  savedAt: string;
  /** Schema version — used for future v2 migration */
  version: 1;
}

/** Static metadata for each widget (not persisted) */
export interface WidgetDefinition {
  id: WidgetId;
  /** Human-readable label used for accessibility and drag handles */
  label: string;
}

/** Default widget order defined by the system (shown to users who never customized) */
export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'quick-actions',
  'kpi-cards',
  'revenue-chart',
  'recent-sales',
  'inventory-movements',
];

/** All widget definitions — source of truth for valid widget IDs */
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: 'quick-actions',       label: 'Ações Rápidas' },
  { id: 'kpi-cards',           label: 'Indicadores (KPIs)' },
  { id: 'revenue-chart',       label: 'Gráfico de Receita' },
  { id: 'recent-sales',        label: 'Vendas Recentes' },
  { id: 'inventory-movements', label: 'Movimentações de Estoque' },
];

/** Set of valid widget IDs for O(1) lookup during validation */
export const VALID_WIDGET_IDS = new Set<WidgetId>(
  WIDGET_DEFINITIONS.map((w) => w.id)
);
