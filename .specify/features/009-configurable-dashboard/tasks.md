# Tasks: Configurable Dashboard with User Layout Persistence

**Branch**: `009-configurable-dashboard`  
**Input**: Design documents from `/specs/009-configurable-dashboard/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Organization**: Tarefas agrupadas por user story para permitir implementação e teste independentes de cada história.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências bloqueantes)
- **[Story]**: User story correspondente (US1, US2, US3)
- Caminhos relativos à raiz do monorepo

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Criar os tipos, constantes e o serviço base que todas as user stories dependem. Nenhuma US pode ser implementada sem esta fase.

**⚠️ CRÍTICO**: Esta fase DEVE ser concluída antes de qualquer trabalho de user story.

- [x] T001 Criar modelo de dados em `apps/frontend/src/app/core/models/dashboard-layout.model.ts` com o tipo `WidgetId` (union literal), interface `DashboardLayout`, interface `WidgetDefinition`, constantes `DEFAULT_WIDGET_ORDER` e `WIDGET_DEFINITIONS`
- [x] T002 Criar `DashboardLayoutService` em `apps/frontend/src/app/core/services/dashboard-layout.service.ts` com signals `widgetOrder` e `isEditMode`, e métodos `loadLayout()`, `enterEditMode()`, `cancelEditMode()`, `moveWidget()`, `saveLayout()` e `resetToDefault()` conforme contrato em `specs/009-configurable-dashboard/contracts/dashboard-layout-service.md`
- [x] T003 Implementar lógica de leitura/escrita no `localStorage` dentro do `DashboardLayoutService` com chave `dashboard_layout_{tenantId}_{userId}`, injetando `AuthService` para obter `user()` signal, incluindo todas as validações do data-model (JSON inválido, IDs desconhecidos, array vazio, mismatch de userId/tenantId)

**Checkpoint**: `DashboardLayoutService` completo e testável isoladamente — `loadLayout()` retorna `DEFAULT_WIDGET_ORDER` quando não há nada salvo, e `saveLayout()` persiste corretamente no localStorage.

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Integrar o CDK DragDrop e criar o componente de toolbar de edição. Estes são bloqueantes para US1 (modo de edição visual).

- [x] T004 Verificar/confirmar que `@angular/cdk` está listado nas dependências em `apps/frontend/package.json` e importar `DragDropModule` onde necessário (sem instalar nova dependência — CDK já disponível)
- [x] T005 [P] Criar componente `DashboardEditToolbarComponent` em `apps/frontend/src/app/features/dashboard/components/dashboard-edit-toolbar/dashboard-edit-toolbar.component.ts` como standalone component com inputs: `isSaving: boolean`, e outputs: `save: EventEmitter<void>`, `cancel: EventEmitter<void>`, `reset: EventEmitter<void>`
- [x] T006 [P] Criar template do `DashboardEditToolbarComponent` em `apps/frontend/src/app/features/dashboard/components/dashboard-edit-toolbar/dashboard-edit-toolbar.component.html` com botões "Salvar Layout", "Cancelar" e "Restaurar Padrão" (com diálogo de confirmação inline para o reset)
- [x] T007 [P] Criar estilos do `DashboardEditToolbarComponent` em `apps/frontend/src/app/features/dashboard/components/dashboard-edit-toolbar/dashboard-edit-toolbar.component.scss` com estilos visuais para o banner de modo de edição (destaque visual que indica estado editável)

**Checkpoint**: Toolbar visualmente completa e renderizável isoladamente com `@Input()` e `@Output()` funcionando.

---

## Phase 3: User Story 1 — Modo de Edição e Drag-and-Drop (Priority: P1) 🎯 MVP

**Goal**: O usuário pode clicar em "Personalizar Dashboard", reordenar widgets via drag-and-drop e salvar o novo layout ou cancelar sem persistir.

**Independent Test**: Abrir a dashboard → clicar "Personalizar" → arrastar qualquer widget para outra posição → clicar "Salvar Layout" → recarregar a página → verificar que a nova ordem permanece.

### Implementation for User Story 1

- [x] T008 [US1] Injetar `DashboardLayoutService` no `DashboardComponent` em `apps/frontend/src/app/features/dashboard/dashboard.component.ts` e expor signals `widgetOrder`, `isEditMode`; chamar `dashboardLayoutService.loadLayout()` no `ngOnInit()`
- [x] T009 [US1] Adicionar botão "Personalizar Dashboard" no cabeçalho da dashboard em `apps/frontend/src/app/features/dashboard/dashboard.component.html` — visível apenas em `lg:` breakpoint (oculto em mobile via classe Tailwind `hidden lg:flex`), ligado ao método `enterEditMode()` do serviço
- [x] T010 [US1] Refatorar o template `apps/frontend/src/app/features/dashboard/dashboard.component.html` para renderizar widgets dinamicamente a partir do signal `widgetOrder()` usando `@for` com `[ngSwitch]` ou mapeamento de componente por ID — substituindo os widgets hardcoded pela lista dinâmica ordenada
- [x] T011 [US1] Adicionar diretivas `cdkDropList` e `cdkDrag` ao container de widgets e a cada widget em `apps/frontend/src/app/features/dashboard/dashboard.component.html`; ligar evento `(cdkDropListDropped)` ao método `dashboardLayoutService.moveWidget($event)`
- [x] T012 [US1] Adicionar indicadores visuais de drag handle em `apps/frontend/src/app/features/dashboard/dashboard.component.html` — ícone de "grip" (⋮⋮) visível em cada widget somente quando `isEditMode()` é `true`; aplicar classe CSS de highlight no card do widget durante edição
- [x] T013 [US1] Adicionar `DashboardEditToolbarComponent` ao template `apps/frontend/src/app/features/dashboard/dashboard.component.html` com `*ngIf="isEditMode()"` (ou `@if`), conectando outputs `(save)`, `(cancel)` e `(reset)` aos métodos do serviço
- [x] T014 [US1] Implementar `saveLayout()` no `DashboardLayoutService` em `apps/frontend/src/app/core/services/dashboard-layout.service.ts` para retornar feedback booleano; no `DashboardComponent`, exibir toast/snackbar de sucesso usando o serviço de notificação existente (ou `alert()` como fallback simples) após salvar com sucesso
- [x] T015 [US1] Adicionar estilos do modo de edição em `apps/frontend/src/app/features/dashboard/dashboard.component.scss` — cursor `grab` nos widgets arrastáveis, sombra/ring de destaque no card em hover durante edição, animação de transição suave ao reordenar (CDK anima automaticamente com `.cdk-drag-animating`)
- [x] T016 [US1] Importar `CdkDragDrop`, `CdkDropList`, `CdkDrag` do `@angular/cdk/drag-drop` e `DashboardEditToolbarComponent` nas `imports[]` do `DashboardComponent` em `apps/frontend/src/app/features/dashboard/dashboard.component.ts`

**Checkpoint**: US1 completamente funcional — drag-and-drop visual funcionando, layout persistido no localStorage após salvar, cancelar descarta alterações. Verificar no DevTools: `localStorage.getItem('dashboard_layout_...')` mostra JSON com nova ordem.

---

## Phase 4: User Story 2 — Persistência Automática por Usuário (Priority: P2)

**Goal**: O layout salvo é carregado automaticamente em toda nova sessão do mesmo usuário, sem qualquer ação extra.

**Independent Test**: Salvar um layout personalizado → fazer logout → login com o mesmo usuário → verificar que a dashboard exibe a ordem salva automaticamente.

### Implementation for User Story 2

- [x] T017 [US2] Garantir que `DashboardLayoutService.loadLayout()` (já criado em T003) é chamado corretamente no `ngOnInit()` do `DashboardComponent` em `apps/frontend/src/app/features/dashboard/dashboard.component.ts` — verificar que o signal `widgetOrder` é populado com os dados do localStorage ANTES da primeira renderização da lista de widgets
- [x] T018 [US2] Implementar lógica de fallback no `DashboardLayoutService.loadLayout()` em `apps/frontend/src/app/core/services/dashboard-layout.service.ts` para o caso de `AuthService.user()` ser `null` no momento da carga (usuário ainda não autenticado) — retornar `DEFAULT_WIDGET_ORDER` silenciosamente sem lançar erro
- [x] T019 [US2] Validar isolamento multi-usuário: garantir que a chave localStorage `dashboard_layout_{tenantId}_{userId}` usa AMBOS os campos de `AuthService.user()` (`tenantId` + `id`), confirmando que dois usuários diferentes no mesmo browser têm chaves distintas — adicionar log de debug (`console.debug`) na leitura/escrita para facilitar verificação manual
- [x] T020 [US2] Adicionar tratamento de edge case de "widget obsoleto" no `DashboardLayoutService.loadLayout()` em `apps/frontend/src/app/core/services/dashboard-layout.service.ts`: filtrar IDs do `widgetOrder` salvo que não existam mais em `WIDGET_DEFINITIONS`; se o array resultante ficar vazio, usar `DEFAULT_WIDGET_ORDER`; emitir `console.warn` listando os IDs filtrados

**Checkpoint**: US2 completamente funcional — logout + login com mesmo usuário → mesmo layout; login com usuário diferente → layout diferente (ou padrão se nunca personalizou).

---

## Phase 5: User Story 3 — Restaurar Layout Padrão (Priority: P3)

**Goal**: O usuário pode restaurar o layout padrão do sistema a qualquer momento, com uma confirmação antes de aplicar.

**Independent Test**: Ter um layout personalizado salvo → acionar "Restaurar Layout Padrão" no toolbar de edição → confirmar → verificar que o layout padrão é exibido e o localStorage é atualizado (ou limpo).

### Implementation for User Story 3

- [x] T021 [US3] Implementar `resetToDefault()` no `DashboardLayoutService` em `apps/frontend/src/app/core/services/dashboard-layout.service.ts`: definir `widgetOrder` signal para `DEFAULT_WIDGET_ORDER`, remover a entrada do localStorage com `localStorage.removeItem(key)` e sair do modo de edição
- [x] T022 [US3] Adicionar lógica de confirmação no `DashboardEditToolbarComponent` em `apps/frontend/src/app/features/dashboard/components/dashboard-edit-toolbar/dashboard-edit-toolbar.component.ts` e `.html`: ao clicar em "Restaurar Padrão", exibir um diálogo de confirmação inline (ex.: toggle de texto "Tem certeza? [Sim] [Não]") sem depender de `window.confirm()` — ao confirmar, emite o output `reset`; ao cancelar, fecha sem ação
- [x] T023 [US3] Conectar o output `(reset)` do `DashboardEditToolbarComponent` no `DashboardComponent` em `apps/frontend/src/app/features/dashboard/dashboard.component.html` ao método `dashboardLayoutService.resetToDefault()`, seguido de feedback visual de confirmação (toast "Layout restaurado ao padrão")

**Checkpoint**: US3 completamente funcional — "Restaurar Padrão" + confirmação → dashboard mostra ordem padrão → localStorage não tem mais entrada para aquele usuário.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Refinamentos de UX, acessibilidade e robustez que beneficiam todas as user stories.

- [x] T024 [P] Adicionar atributos ARIA ao container drag-drop em `apps/frontend/src/app/features/dashboard/dashboard.component.html`: `aria-label="Lista de widgets do dashboard — modo de edição ativo"` no `cdkDropList`, e `aria-grabbed` dinâmico em cada `cdkDrag`; adicionar `cdkDragHandle` com `aria-label="Arrastar widget {label}"` nos drag handles
- [x] T025 [P] Adicionar feedback visual de erro de salvamento no `DashboardComponent` em `apps/frontend/src/app/features/dashboard/dashboard.component.ts`: se `saveLayout()` retornar `false`, exibir mensagem de erro inline ("Não foi possível salvar o layout. Tente novamente.") mantendo o modo de edição ativo
- [x] T026 [P] Garantir que o botão "Personalizar Dashboard" em `apps/frontend/src/app/features/dashboard/dashboard.component.html` usa `hidden lg:flex` (Tailwind) para estar completamente oculto em viewports menores que 1024px — verificar em DevTools com viewport de 768px que o botão não aparece e o layout salvo ainda é exibido corretamente
- [x] T027 Revisar e atualizar o checklist de qualidade em `specs/009-configurable-dashboard/checklists/requirements.md` para refletir decisão de localStorage v1 e confirmar todos os requisitos funcionais (FR-001 a FR-012) como implementados

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────────── sem dependências
    │
    ▼
Phase 2 (Foundational) ──────── depende de Phase 1 completa
    │
    ├──► Phase 3 (US1 — P1) ── depende de Phase 2 completa  🎯 MVP
    │        │
    │        ▼
    ├──► Phase 4 (US2 — P2) ── depende de Phase 2 + US1 parcialmente
    │
    └──► Phase 5 (US3 — P3) ── depende de Phase 2 + US1 completa
             │
             ▼
         Phase 6 (Polish) ───── depende de todas as US desejadas
```

### User Story Dependencies

- **US1 (P1)**: Depende de Phase 1 + Phase 2 — **sem dependências de outras US**
- **US2 (P2)**: Depende de T002, T003 (serviço) e T008 (ngOnInit) já existentes da US1 — logicamente sequencial após US1
- **US3 (P3)**: Depende de T005–T007 (toolbar) e T008 (DashboardComponent) da US1

### Dentro de Cada User Story

```
Modelos/Tipos (T001) → Serviço (T002, T003) → Template dinâmico (T010) →
CDK DragDrop (T011) → Handles visuais (T012) → Toolbar (T013) → Feedback (T014)
```

### Oportunidades de Paralelismo

- **Phase 1**: T001 → T002 → T003 (sequencial por dependência)
- **Phase 2**: T005, T006, T007 podem rodar em paralelo após T004
- **Phase 3 (US1)**: T009 e T010 podem rodar em paralelo após T008
- **Phase 6 (Polish)**: T024, T025, T026 podem rodar em paralelo

---

## Parallel Example: User Story 1

```bash
# Após T008 (injeção do serviço no DashboardComponent):
Parallel: T009 — botão Personalizar no header
Parallel: T010 — refatorar template para renderização dinâmica de widgets

# Após T010:
Sequential: T011 — diretivas cdkDragDrop
Sequential: T012 — drag handles visuais
Sequential: T013 — toolbar de edição
Sequential: T014 — feedback de salvamento
Sequential: T015 — estilos CSS modo edição
Sequential: T016 — imports no @Component
```

---

## Implementation Strategy

### MVP First (User Story 1 Apenas)

1. Completar **Phase 1** (T001–T003) — serviço base
2. Completar **Phase 2** (T004–T007) — toolbar e CDK
3. Completar **Phase 3** (T008–T016) — drag-drop + salvar/cancelar
4. **PARAR E VALIDAR**: Layout editável, drag-and-drop funcionando, salvo no localStorage, cancelar descarta
5. Demo/deploy do MVP

### Entrega Incremental

1. Phase 1 + Phase 2 → Base pronta
2. Phase 3 (US1) → **MVP** — drag-and-drop + persistência básica ✅
3. Phase 4 (US2) → Auto-carregamento robusto validado ✅
4. Phase 5 (US3) → Restauração de padrão ✅
5. Phase 6 → Polish + ARIA + feedback de erro ✅

---

## Notes

- `[P]` = arquivos diferentes, sem dependências bloqueantes entre si
- Cada user story é independentemente testável após sua phase ser concluída
- Commitar após cada task ou grupo lógico (ex.: após T003, após T007, após T016)
- Verificar no DevTools → Application → Local Storage após cada salvamento
- A chave localStorage esperada é: `dashboard_layout_{tenantId}_{userId}` — inspecionar com o usuário logado para confirmar o valor correto
- **Zero novas dependências de pacote** — `@angular/cdk` já disponível
- Na migração para v2: apenas `DashboardLayoutService` precisa ser alterado; todos os componentes permanecem intactos
