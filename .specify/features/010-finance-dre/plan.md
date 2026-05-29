# Implementation Plan: Financeiro Completo & DRE

**Branch**: `010-finance-dre` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-finance-dre/spec.md`

## Summary

Implementar um controle completo de contas a pagar e a receber, gerando relatórios de fluxo de caixa e Demonstração do Resultado do Exercício (DRE) simplificados. As vendas a prazo (boleto) gerarão recebíveis automaticamente, e o CMV será calculado de forma imutável a partir do momento da venda. É necessária exportação para PDF.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+, Angular 17+)
**Primary Dependencies**: NestJS, Prisma, Angular Signals, Tailwind CSS, `pdfmake` (resolved from NEEDS CLARIFICATION)
**Storage**: PostgreSQL 15+
**Testing**: Jest (Backend), Jasmine/Jest (Frontend)
**Target Platform**: Web Browser
**Project Type**: Web Application
**Performance Goals**: < 2 seconds for DRE and Cash Flow with 100k transactions
**Constraints**: Multi-tenancy (tenant_id scoping), RBAC (ADMIN/SUPER_ADMIN only)
**Scale/Scope**: ~100k transactions per tenant

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Multi-Tenancy First**: All new tables (`FinancialAccount`, etc.) MUST have `tenant_id` and all queries scoped.
- [x] **RBAC Everywhere**: Controllers and UI routes MUST be guarded by `ADMIN` or `SUPER_ADMIN`.
- [x] **Type-Safety**: DTOs will define the contract for DRE, Cash Flow and Financial Accounts.
- [x] **Observability**: Errors during PDF generation or financial calculation MUST be structured.
- [x] **Simplicity & YAGNI**: We will implement PDF export as requested, without adding extra formats like Excel unless specified later.

## Project Structure

### Documentation (this feature)

```text
specs/010-finance-dre/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── application/use-cases/finance/
│   ├── domain/entities/finance/
│   └── infrastructure/
│       ├── controllers/finance.controller.ts
│       ├── dtos/finance/
│       └── persistence/finance/

apps/frontend/
├── src/
│   └── app/
│       └── features/
│           └── finance/
│               ├── components/
│               ├── pages/
│               └── services/
```

**Structure Decision**: Option 2: Web application (frontend + backend).
