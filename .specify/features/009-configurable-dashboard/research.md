# Research: Configurable Dashboard with User Layout Persistence

**Feature**: `009-configurable-dashboard`  
**Date**: 2026-05-28  
**Status**: Complete

---

## Decision 1: Drag-and-Drop Library for Angular

**Decision**: Use `@angular/cdk` CDK DragDropModule (já incluído no projeto via Angular CDK).

**Rationale**: A aplicação usa Angular 17+ com Standalone Components. O `@angular/cdk/drag-drop` é a escolha natural para projetos Angular — zero dependência adicional (já disponível via `@angular/cdk`), suporte nativo a reordenação de listas (`cdkDropList` + `moveItemInArray`), integração perfeita com Angular Signals, e manutenção garantida pelo time do Angular. Alternativas externas (SortableJS, ng2-dragula) adicionam bundle size sem benefício justificável para sequência linear simples.

**Alternativas consideradas**:
- `SortableJS` via `ngx-sortablejs` — mais recursos (touch, multi-list), porém dependência extra e ~15kb adicionais. Complexidade não justificada para v1.
- `ng2-dragula` — obsoleto, manutenção irregular. Descartado.

---

## Decision 2: Estratégia de Persistência v1 (localStorage)

**Decision**: `localStorage` com chave composta `dashboard_layout_{tenantId}_{userId}`.

**Rationale**: Elimina toda dependência de backend para a v1. O `AuthService` já disponibiliza `user.id` e `user.tenantId` via signal (`this.authService.user()`), tornando a construção da chave trivial. O `tenantId` garante isolamento multi-tenant mesmo no localStorage (ex.: usuário de tenant A e tenant B no mesmo browser ficam isolados). O valor armazenado é um JSON simples (`string[]` — array de widget IDs na ordem desejada), de tamanho mínimo (~200 bytes).

**Limitação documentada (v1)**: Layout não é sincronizado entre navegadores/dispositivos diferentes. Usuário que troca de dispositivo vê o layout padrão. Aceita como tradeoff explícito para v1.

**Alternativas consideradas**:
- `sessionStorage` — perdido ao fechar o navegador. Descartado (não atende requisito de persistência entre sessões).
- Backend API (v2) — correto para produção multi-dispositivo, mas excede escopo da v1.
- `IndexedDB` — excessivo para dados tão simples (~200 bytes). Descartado.

---

## Decision 3: Serviço de Layout (DashboardLayoutService)

**Decision**: Criar `DashboardLayoutService` como serviço Angular standalone (`providedIn: 'root'`), separado do `DashboardService` existente.

**Rationale**: O `DashboardService` já tem responsabilidade clara (fetch de dados do backend, SSE, chart). Misturar lógica de layout quebraria o princípio de responsabilidade única e dificultaria a migração para backend na v2. Um serviço dedicado encapsula: leitura/escrita no localStorage, lista de widget IDs padrão, e o signal de estado do layout atual. A interface do serviço é projetada para suportar facilmente a substituição do localStorage por chamadas HTTP na v2 (Strategy pattern implícito).

**Alternativas consideradas**:
- Lógica embutida no `DashboardComponent` — impossibilita reutilização e torna o componente responsável por persistência. Descartado.
- State management externo (NgRx) — overhead injustificado. Angular Signals é suficiente. Descartado.

---

## Decision 4: Modo de Edição — Estado Local vs. Global

**Decision**: Estado de modo de edição (`isEditMode`) é um Signal **local** no `DashboardComponent`, não persistido.

**Rationale**: O modo de edição é uma estado de UI transitório — ativo apenas enquanto o usuário está reorganizando. Não precisa sobreviver a navegações ou recarregamentos. Manter no componente simplifica o ciclo de vida: ativo quando entra, desativado ao salvar ou cancelar. O layout em edição (rascunho) é mantido em uma cópia local do array de widgets (`editableLayout`) que só substitui o layout oficial ao salvar.

---

## Decision 5: Identificadores de Widgets

**Decision**: Array de strings com IDs fixos correspondendo aos componentes existentes:

```typescript
export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'quick-actions',
  'kpi-cards',
  'revenue-chart',
  'recent-sales',
  'inventory-movements',
];
```

**Rationale**: IDs fixos e estáveis permitem que o localStorage armazene apenas um array compacto de strings. O componente mapeia cada ID para seu componente Angular correspondente. Se um ID salvo não existir mais (widget removido em versão futura), o sistema o ignora graciosamente (edge case coberto na spec). A definição de IDs válidos como `type WidgetId` garante type-safety (Constituição — Princípio III).

---

## Decision 6: Breakpoint para Modo de Edição (Mobile)

**Decision**: O botão "Personalizar" é ocultado em viewports menores que `lg` (1024px via Tailwind), consistente com a responsividade existente no dashboard (grid `lg:grid-cols-2`).

**Rationale**: A dashboard atual já usa classes `lg:` do Tailwind para layouts de múltiplas colunas. Usar o mesmo breakpoint garante consistência visual. Em telas menores que `lg`, o layout salvo é exibido de forma linear responsiva, mas sem a opção de edição — alinhado com o que a spec define.

---

## Impacto na Constituição

| Princípio | Status | Observação |
|-----------|--------|-----------|
| I. Multi-Tenancy First | ✅ Atendido | Chave localStorage inclui `tenantId` — sem vazamento entre tenants |
| II. RBAC Everywhere | ✅ Atendido | Todos os usuários autenticados podem personalizar (sem restrição de role); feature acessível apenas dentro da rota autenticada |
| III. Type-Safety | ✅ Atendido | `WidgetId` como tipo literal; sem `any` |
| IV. Observability | ✅ Atendido | Erros de leitura/escrita no localStorage tratados e logados no console |
| V. Simplicity & YAGNI | ✅ Atendido | Zero novas dependências; localStorage para v1 é a solução mais simples |
