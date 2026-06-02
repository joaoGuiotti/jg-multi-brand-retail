# Tasks: Comissionamento Inteligente (% Fixa)

**Feature Branch**: `011-fixed-commissions`

## Implementation Strategy
- **MVP**: Entrega do cálculo base (US1 e US2) garantindo a gravação correta no banco. 
- **Fase Seguintes**: Criação da UI de dashboard para o vendedor.

## Phase 1: Foundational (Database & Primitives)
- [ ] T001 Update Prisma schema with `SalesTarget`, `CommissionTransaction`, and `commissionRate` in `apps/backend/prisma/schema.prisma`
- [ ] T002 Generate Prisma migration and apply to database.

## Phase 2: User Story 1 (Configuração de Metas e Comissão)
- [ ] T003 [P] [US1] Create CreateSalesTargetUseCase in `apps/backend/src/application/use-cases/finance/create-sales-target.use-case.ts`
- [ ] T004 [P] [US1] Create UI Component `sales-target-manager.component.ts` in `apps/frontend/src/app/features/settings/`
- [ ] T005 [P] [US1] Update `tenant-settings.component.ts` to include commission rate field in `apps/frontend/src/app/features/settings/tenant-settings.component.ts`

## Phase 3: User Story 2 (Cálculo Automático)
- [ ] T006 [US2] Implement event listener `calculate-commission.handler.ts` for `SaleCompletedEvent` in `apps/backend/src/application/use-cases/finance/calculate-commission.handler.ts`

## Phase 4: User Story 3 (Dashboard do Vendedor)
- [ ] T007 [P] [US3] Implement `get-seller-dashboard-metrics.use-case.ts` in `apps/backend/src/application/use-cases/finance/get-seller-dashboard-metrics.use-case.ts`
- [ ] T008 [P] [US3] Expose REST endpoints in `apps/backend/src/infrastructure/controllers/finance.controller.ts` (or create `commission.controller.ts`)
- [ ] T009 [US3] Update UI `sales-dashboard.component.ts` to display metrics cards in `apps/frontend/src/app/features/sales/sales-dashboard.component.ts`

## Dependencies
- Phase 1 must be completed before any User Story.
- US1 and US2 can be developed in parallel since they don't block each other's code paths (one is config, one is reaction to sale), though US2 depends on US1 data for runtime testing.
- US3 depends on US1 and US2 completion.
