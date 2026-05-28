# Implementation Plan: Configurable Dashboard with User Layout Persistence

**Branch**: `009-configurable-dashboard` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-configurable-dashboard/spec.md`

---

## Summary

Implementar um dashboard configurável no frontend Angular que permita ao usuário autenticado reordenar widgets via drag-and-drop e salvar o layout personalizado. Na **v1**, a persistência é exclusivamente no `localStorage` com chave isolada por `tenantId + userId`. O layout é carregado automaticamente em cada sessão. Um `DashboardLayoutService` encapsula toda a lógica de persistência, projetado para facilitar a migração para backend API na v2 sem alterar os componentes consumidores.

**Zero dependências novas**: uso exclusivo do `@angular/cdk/drag-drop` (já disponível) e das APIs nativas do navegador (`localStorage`).

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — Angular 17+  
**Primary Dependencies**: Angular CDK (`@angular/cdk/drag-drop`), Angular Signals, Tailwind CSS  
**Storage**: `localStorage` (v1) — browser-native, zero setup  
**Testing**: Jest (frontend unit tests, padrão existente)  
**Target Platform**: Web — desktop (≥ 1024px para modo de edição); mobile apenas visualização  
**Project Type**: Frontend feature (SPA Angular standalone components)  
**Performance Goals**: Transição modo edição ↔ visualização < 100ms; sem re-renders desnecessários via Angular Signals  
**Constraints**: Zero novas dependências de pacote; compatível com Angular strict mode; Tailwind CSS para estilização  
**Scale/Scope**: 5 widgets fixos; 1 layout por usuário por tenant; ~300 bytes no localStorage

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| I. Multi-Tenancy First | ✅ PASS | Chave localStorage inclui `tenantId_userId` — isolamento completo entre tenants e usuários |
| II. RBAC Everywhere | ✅ PASS | Feature restrita a usuários autenticados pela rota guard existente; todos os roles podem personalizar (sem hierarquia de acesso adicional necessária) |
| III. Type-Safety & Contract Integrity | ✅ PASS | `WidgetId` como tipo literal union; `DashboardLayout` interface tipada; sem `any`; strict mode mantido |
| IV. Observability & Structured Error Handling | ✅ PASS | Erros de `localStorage` capturados e logados; fallback gracioso para layout padrão; feedback visual ao usuário |
| V. Simplicity & YAGNI | ✅ PASS | Zero dependências novas; localStorage para v1; Angular CDK já disponível; Angular Signals preferido sobre RxJS |

**Resultado**: ✅ Todos os gates passam. Nenhuma violação. Prosseguir para implementação.

---

## Project Structure

### Documentation (this feature)

```text
specs/009-configurable-dashboard/
├── spec.md              ✅ Criado
├── research.md          ✅ Criado (Phase 0)
├── data-model.md        ✅ Criado (Phase 1)
├── plan.md              ✅ Este arquivo
├── contracts/
│   └── dashboard-layout-service.md  ✅ Criado (Phase 1)
└── tasks.md             ⏳ Gerado por /speckit-tasks
```

### Source Code — Arquivos a criar/modificar

```text
apps/frontend/src/app/
├── core/
│   ├── models/
│   │   └── dashboard-layout.model.ts          [NEW] — tipos WidgetId, DashboardLayout, WidgetDefinition, constantes
│   └── services/
│       └── dashboard-layout.service.ts        [NEW] — DashboardLayoutService
│
└── features/
    └── dashboard/
        ├── dashboard.component.ts             [MODIFY] — integrar DashboardLayoutService, modo de edição
        ├── dashboard.component.html           [MODIFY] — botão Personalizar, drag-drop, botões Salvar/Cancelar
        ├── dashboard.component.scss           [MODIFY] — estilos do modo de edição (drag handles, overlay)
        └── components/
            └── dashboard-edit-toolbar/        [NEW] — componente barra de ações do modo de edição
                ├── dashboard-edit-toolbar.component.ts
                ├── dashboard-edit-toolbar.component.html
                └── dashboard-edit-toolbar.component.scss
```

---

## Complexity Tracking

> Sem violações de constituição — seção não aplicável.

---

## Resumo de Decisões de Design

| Decisão | Escolha | Alternativa Rejeitada |
|---------|---------|----------------------|
| Drag-and-drop | `@angular/cdk/drag-drop` | SortableJS (dependência extra) |
| Persistência v1 | `localStorage` com chave composta | sessionStorage (sem persistência cross-session) |
| Estado do modo de edição | Signal local no componente | NgRx (overkill) |
| Serviço de layout | `DashboardLayoutService` separado | Lógica embutida no DashboardService (viola SRP) |
| Isolamento multi-tenant | Chave `{tenantId}_{userId}` | Apenas `{userId}` (sem isolamento tenant) |
| Breakpoint mobile | `lg` (1024px) | `md` (inconsistente com grid existente) |

---

## Roadmap v1 → v2

```
v1 (esta feature)
└── localStorage: dashboard_layout_{tenantId}_{userId}
    └── DashboardLayoutService.saveLayout() → localStorage.setItem(...)
    └── DashboardLayoutService.loadLayout() → localStorage.getItem(...)

v2 (futuro)
└── Backend API: PUT /api/v1/dashboard/layout
    └── DashboardLayoutService.saveLayout() → http.put(...)  ← mesma interface
    └── DashboardLayoutService.loadLayout() → http.get(...)  ← mesma interface
    └── Novo: DashboardLayoutController (NestJS)
    └── Novo: UserDashboardLayout (Prisma model com tenant_id)
```

A interface pública do serviço permanece idêntica — os componentes não precisam ser alterados na migração para v2.
