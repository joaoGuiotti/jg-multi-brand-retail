# Data Model: Configurable Dashboard with User Layout Persistence

**Feature**: `009-configurable-dashboard`  
**Date**: 2026-05-28  
**Storage**: Frontend localStorage (v1) | Backend DB (v2 — futuro)

---

## Tipos Principais

### `WidgetId` (tipo literal union)

Representa o identificador único de cada widget da dashboard. Definido como tipo literal para garantir type-safety.

```typescript
export type WidgetId =
  | 'quick-actions'
  | 'kpi-cards'
  | 'revenue-chart'
  | 'recent-sales'
  | 'inventory-movements';
```

---

### `DashboardLayout`

Representa o estado completo do layout de um usuário.

```typescript
export interface DashboardLayout {
  /** ID do usuário proprietário deste layout */
  userId: string;
  /** ID do tenant (para isolamento multi-tenant no localStorage) */
  tenantId: string;
  /** Array de IDs de widgets na ordem desejada pelo usuário (índice 0 = primeiro widget exibido) */
  widgetOrder: WidgetId[];
  /** Timestamp ISO 8601 da última vez que o layout foi salvo */
  savedAt: string;
  /** Versão do schema do layout (para migração futura) */
  version: 1;
}
```

**Invariantes**:
- `widgetOrder` DEVE conter ao menos 1 elemento.
- `widgetOrder` DEVE conter apenas IDs válidos da union `WidgetId`.
- IDs em `widgetOrder` não se repetem (cada widget aparece no máximo uma vez).
- `version: 1` é fixo na v1 para habilitar migração de schema na v2.

---

### `WidgetDefinition`

Metadados estáticos de cada widget — não persistidos, definidos em código.

```typescript
export interface WidgetDefinition {
  id: WidgetId;
  /** Rótulo legível para uso em acessibilidade e drag handle */
  label: string;
}
```

---

### `DEFAULT_WIDGET_ORDER`

Constante que define a ordem padrão do sistema (estado sem personalização):

```typescript
export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'quick-actions',
  'kpi-cards',
  'revenue-chart',
  'recent-sales',
  'inventory-movements',
];

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: 'quick-actions',       label: 'Ações Rápidas' },
  { id: 'kpi-cards',           label: 'Indicadores (KPIs)' },
  { id: 'revenue-chart',       label: 'Gráfico de Receita' },
  { id: 'recent-sales',        label: 'Vendas Recentes' },
  { id: 'inventory-movements', label: 'Movimentações de Estoque' },
];
```

---

## Estratégia de Armazenamento (localStorage — v1)

### Chave de armazenamento

```
dashboard_layout_{tenantId}_{userId}
```

**Exemplo**: `dashboard_layout_tenant-abc123_user-xyz456`

**Justificativa**: A combinação `tenantId + userId` garante isolamento completo mesmo que dois usuários de tenants diferentes compartilhem o mesmo navegador.

### Formato persistido

O valor armazenado é o JSON serializado de `DashboardLayout`:

```json
{
  "userId": "user-xyz456",
  "tenantId": "tenant-abc123",
  "widgetOrder": ["kpi-cards", "revenue-chart", "quick-actions", "recent-sales", "inventory-movements"],
  "savedAt": "2026-05-28T14:30:00.000Z",
  "version": 1
}
```

**Tamanho estimado**: ~300–400 bytes. Irrelevante para o limite de 5MB do localStorage.

---

## Regras de Validação (leitura do localStorage)

Ao carregar o layout do localStorage, o `DashboardLayoutService` DEVE validar:

1. O JSON é parseável (sem erros de `JSON.parse`).
2. `widgetOrder` é um array não vazio.
3. Todos os elementos de `widgetOrder` são `WidgetId` válidos. IDs inválidos são **filtrados silenciosamente** (compatibilidade com remoção futura de widgets).
4. Após filtrar IDs inválidos, `widgetOrder` ainda contém ao menos 1 elemento. Se vazio, usa `DEFAULT_WIDGET_ORDER`.
5. `userId` e `tenantId` no registro salvo correspondem ao usuário autenticado atual. Se não corresponderem, usa `DEFAULT_WIDGET_ORDER` (proteção contra troca de conta no mesmo browser).

---

## Diagrama de Estado do Layout

```
[Não personalizado]
       │
       │  usuário salva layout
       ▼
[Layout Personalizado (localStorage)]
       │
       │  usuário restaura padrão
       ▼
[Não personalizado]  ←──────────────────
                                         │
       [Modo de Edição — estado transitório em memória]
       ├── Salvar  ──► [Layout Personalizado]
       └── Cancelar ─► [estado anterior ao modo de edição]
```

---

## Plano de Migração para v2 (backend)

Na v2, o `DashboardLayoutService` substituirá as chamadas de `localStorage` por chamadas HTTP a:

```
GET  /api/v1/dashboard/layout        → carrega layout do usuário
PUT  /api/v1/dashboard/layout        → salva/atualiza layout do usuário
DELETE /api/v1/dashboard/layout      → restaura layout padrão (deleta registro)
```

O campo `version: 1` na estrutura `DashboardLayout` permite que o backend migre automaticamente layouts antigos se o schema mudar. A interface do serviço permanece idêntica para os consumidores (componentes), tornando a migração transparente.
