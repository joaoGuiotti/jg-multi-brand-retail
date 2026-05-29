# Implementation Tasks: Financeiro Completo & DRE

**Feature Branch**: `010-finance-dre`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Implementation Strategy

We will deliver this feature incrementally by following the user stories in priority order. 
- **MVP**: Delivery of US1 and US2 ensures the core financial tracking of payables and receivables works.
- **V2**: Delivery of US3 and US4 adds the reporting layer (Cash Flow and DRE).

## Dependencies

- US1 and US2 depend on Foundational models and APIs.
- US3 depends on US1 and US2 (needs data to aggregate).
- US4 depends on US1, US2, and the `SaleItem` changes.

---

## Phase 1: Setup

*Goal: Project initialization and environment setup*
*Independent Test*: App builds and runs with new dependencies installed.

- [ ] T001 Install `pdfmake` library in backend: `apps/backend/package.json`

## Phase 2: Foundational

*Goal: Core data models and shared interfaces required by all user stories*
*Independent Test*: Database migrations apply successfully.

- [ ] T002 Update Prisma schema to add `FinancialAccount` model and update `SaleItem` in `apps/backend/prisma/schema.prisma`
- [ ] T003 Generate and apply Prisma migration for financial models
- [ ] T004 [P] Create DTOs (`CreateAccountDto`, `PayAccountDto`) in `apps/backend/src/infrastructure/dtos/finance/finance.dto.ts`
- [ ] T005 [P] Create shared Angular service and types in `apps/frontend/src/app/features/finance/services/finance.service.ts`

## Phase 3: Gestão de Contas a Receber Automáticas [US1]

*Goal: Automatically generate receivables from deferred sales*
*Independent Test*: Completing a sale via Boleto creates a receivable in the database.

- [ ] T006 [US1] Implement `CreateReceivableFromSale` use case in `apps/backend/src/application/use-cases/finance/create-receivable.use-case.ts`
- [ ] T007 [US1] Hook sale completion event to trigger receivable creation in `apps/backend/src/application/use-cases/sales/complete-sale.use-case.ts`
- [ ] T008 [US1] Record cost price on `SaleItem` during sale creation in `apps/backend/src/application/use-cases/sales/create-sale.use-case.ts`

## Phase 4: Gestão Manual de Contas a Pagar e Receber [US2]

*Goal: Manual CRUD operations for financial accounts*
*Independent Test*: Users can manually add and pay accounts via the UI.

- [ ] T009 [P] [US2] Implement account query and command use cases (`CreateAccount`, `PayAccount`, `ListAccounts`) in `apps/backend/src/application/use-cases/finance/account-management.use-case.ts`
- [ ] T010 [P] [US2] Create REST endpoints for accounts in `apps/backend/src/infrastructure/controllers/finance.controller.ts`
- [ ] T011 [US2] Create Angular accounts list page UI in `apps/frontend/src/app/features/finance/pages/account-list/account-list.component.html` and `.ts`
- [ ] T012 [US2] Create Angular account form component in `apps/frontend/src/app/features/finance/components/account-form/account-form.component.html` and `.ts`

## Phase 5: Visualização do Fluxo de Caixa [US3]

*Goal: Dashboard displaying daily and monthly cash flow*
*Independent Test*: Cash flow endpoints return aggregated inflows/outflows and UI displays them.

- [ ] T013 [P] [US3] Implement `GetCashFlow` use case in `apps/backend/src/application/use-cases/finance/get-cash-flow.use-case.ts`
- [ ] T014 [P] [US3] Add cash flow endpoint to `apps/backend/src/infrastructure/controllers/finance.controller.ts`
- [ ] T015 [US3] Create Angular cash flow dashboard page in `apps/frontend/src/app/features/finance/pages/cash-flow/cash-flow.component.html` and `.ts`

## Phase 6: Demonstração do Resultado do Exercício (DRE) [US4]

*Goal: DRE report calculation and PDF export*
*Independent Test*: System calculates Net Profit accurately and exports PDF.

- [ ] T016 [P] [US4] Implement `CalculateDRE` use case in `apps/backend/src/application/use-cases/finance/calculate-dre.use-case.ts`
- [ ] T017 [P] [US4] Implement `GenerateDREPdf` use case using `pdfmake` in `apps/backend/src/application/use-cases/finance/generate-dre-pdf.use-case.ts`
- [ ] T018 [P] [US4] Add DRE and PDF endpoints to `apps/backend/src/infrastructure/controllers/finance.controller.ts`
- [ ] T019 [US4] Create Angular DRE report page and PDF download button in `apps/frontend/src/app/features/finance/pages/dre-report/dre-report.component.html` and `.ts`

## Final Phase: Polish & Cross-Cutting Concerns

*Goal: Polish UI, add RBAC guards, and verify tenant isolation*
*Independent Test*: Non-admin users are blocked from accessing finance routes.

- [ ] T020 [P] Ensure all backend finance controllers enforce `ADMIN` or `SUPER_ADMIN` RBAC guard.
- [ ] T021 [P] Ensure all frontend finance routes enforce AuthGuard and RBAC checks.
- [ ] T022 Update main sidebar to include links to Finance pages for authorized users in `apps/frontend/src/app/core/components/sidebar/sidebar.component.html`.
