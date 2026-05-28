# Tasks: 008-loyalty-cashback

**Input**: Design documents from `.specify/features/008-loyalty-cashback/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included as standard verification criteria for quality assurance.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All descriptions include exact file paths.

---

## Path Conventions

- **Backend**: `apps/backend/src/`
- **Frontend**: `apps/frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base configurations.

- [x] T001 [P] Register the new LoyaltyModule in apps/backend/src/app.module.ts
- [x] T002 [P] Create initial folder structures for loyalty feature inside apps/backend/src/domain/entities/loyalty/
- [x] T003 [P] Create initial folder structures for loyalty feature inside apps/frontend/src/app/features/loyalty/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema and repository structures that must be complete before any user story can begin.

- [x] T004 Update apps/backend/prisma/schema.prisma to include LoyaltyProgram, LoyaltyAccount, and LoyaltyTransaction models
- [x] T005 Execute database migrations and verify schema update in apps/backend via `npx prisma migrate dev`
- [x] T006 [P] Create the repository interface ILoyaltyRepository in apps/backend/src/domain/repositories/loyalty/loyalty.repository.interface.ts
- [x] T007 Implement the concrete PrismaLoyaltyRepository in apps/backend/src/infrastructure/persistence/loyalty/prisma-loyalty.repository.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Configuração do Programa de Fidelidade (Priority: P1) 🎯 MVP

**Goal**: Permitir que o Admin configure as regras de acúmulo, resgate e limites de desconto do programa de fidelidade do seu tenant.

**Independent Test**: Enviar requisição HTTP PUT para `/api/v1/loyalty/config` com payload de regras e verificar se as regras são salvas e retornadas corretamente filtradas pelo Tenant ativo.

### Implementation for User Story 1

- [x] T008 [P] [US1] Create LoyaltyProgram domain entity class in apps/backend/src/domain/entities/loyalty/loyalty-program.entity.ts
- [x] T009 [P] [US1] Create ConfigureLoyaltyProgramDto class with class-validator decorators in apps/backend/src/infrastructure/dtos/loyalty/configure-loyalty-program.dto.ts
- [x] T010 [US1] Implement ConfigureLoyaltyProgramUseCase in apps/backend/src/application/use-cases/loyalty/configure-loyalty-program.use-case.ts
- [x] T011 [US1] Implement HTTP PUT config route in apps/backend/src/infrastructure/controllers/loyalty.controller.ts
- [x] T012 [P] [US1] Create Angular LoyaltyService HTTP configuration method in apps/frontend/src/app/features/loyalty/services/loyalty.service.ts
- [x] T013 [US1] Create Angular LoyaltyConfigComponent page layout and reactive settings form in apps/frontend/src/app/features/loyalty/pages/loyalty-config/loyalty-config.component.ts
- [x] T014 [US1] Register Admin settings route in apps/frontend/src/app/app.routes.ts for loyalty configurations

**Checkpoint**: User Story 1 (Admin Setup) is fully functional and testable.

---

## Phase 4: User Story 2 - Acúmulo Automático de Pontos de Fidelidade (Priority: P1)

**Goal**: Calcular e acumular automaticamente pontos de fidelidade baseados no valor final líquido de compras concluídas no PDV com cliente selecionado.

**Independent Test**: Concluir uma venda no valor de R$ 150,00 associada a um cliente de testes e confirmar se o saldo da conta corrente de fidelidade dele foi incrementado em 150 pontos e se um log de tipo `EARN` foi registrado.

### Implementation for User Story 2

- [x] T015 [P] [US2] Create LoyaltyAccount and LoyaltyTransaction domain entities in apps/backend/src/domain/entities/loyalty/
- [x] T016 [US2] Implement EarnPointsUseCase to calculate point accumulation based on final liquid total in apps/backend/src/application/use-cases/loyalty/earn-points.use-case.ts
- [x] T017 [US2] Implement asynchronous event listener for SaleCompletedEvent to call EarnPointsUseCase in apps/backend/src/application/events/handlers/loyalty-events.handler.ts
- [x] T018 [US2] Update apps/backend/src/infrastructure/modules/loyalty.module.ts to register event handlers and repositories
- [x] T019 [US2] Write unit tests for EarnPointsUseCase verifying floor rounding logic in apps/backend/src/application/use-cases/loyalty/earn-points.use-case.spec.ts

**Checkpoint**: User Story 2 (Automatic Earnings) works independently and is verified by tests.

---

## Phase 5: User Story 3 - Resgate de Cashback no PDV (Priority: P2)

**Goal**: Permitir que o vendedor selecione e aplique pontos acumulados como desconto na venda ativa no PDV, atualizando dinamicamente o total do carrinho.

**Independent Test**: No PDV Angular, selecionar um cliente com 300 pontos (equivalente a R$ 3,00 de desconto), aplicar o resgate em uma venda de R$ 50,00 e confirmar que o valor líquido a pagar reduziu para R$ 47,00, gerando transação de resgate `REDEEM` com trava pessimista de escrita no banco.

### Implementation for User Story 3

- [x] T020 [P] [US3] Create RedeemPointsDto class with strict integer validation in apps/backend/src/infrastructure/dtos/loyalty/redeem-points.dto.ts
- [x] T021 [US3] Implement RedeemPointsUseCase wrapping balance query and update with FOR UPDATE write locks in apps/backend/src/application/use-cases/loyalty/redeem-points.use-case.ts
- [x] T022 [US3] Implement POST `/loyalty/redeem` controller endpoint in apps/backend/src/infrastructure/controllers/loyalty.controller.ts
- [x] T023 [US3] Implement Angular Signal-based LoyaltyStore to manage client balance and active cart discounts in apps/frontend/src/app/features/loyalty/store/loyalty.store.ts
- [x] T024 [US3] Create Angular LoyaltyBadgeComponent showing current points and cashback balance in apps/frontend/src/app/features/loyalty/components/loyalty-badge/
- [x] T025 [US3] Create Angular RedeemDialogComponent modal letting user choose how many points to redeem in apps/frontend/src/app/features/loyalty/components/redeem-dialog/
- [x] T026 [US3] Integrate LoyaltyBadge and RedeemDialog inside POS checkout page in apps/frontend/src/app/features/sales/pages/pos/pos.component.ts
- [x] T027 [US3] Write unit tests for RedeemPointsUseCase validating double-redemption race conditions protection in apps/backend/src/application/use-cases/loyalty/redeem-points.use-case.spec.ts

**Checkpoint**: POS cashback redemption works end-to-end and has concurrency validation.

---

## Phase 6: User Story 4 - Extrato de Pontos & Ajuste Manual (Priority: P3)

**Goal**: Exibir o extrato detalhado de movimentações para clientes e permitir que o Admin faça ajustes manuais de débito/crédito auditados.

**Independent Test**: Realizar um ajuste manual administrativo de +50 pontos justificando o motivo, e verificar se o saldo é atualizado, gravando o tipo `ADJUST` e a justificativa para auditoria.

### Implementation for User Story 4

- [x] T028 [P] [US4] Create AdjustPointsManualDto class requiring detailed reason in apps/backend/src/infrastructure/dtos/loyalty/adjust-points-manual.dto.ts
- [x] T029 [US4] Implement AdjustPointsManualUseCase checking admin role permissions and recording mandatory audit text in apps/backend/src/application/use-cases/loyalty/adjust-points-manual.use-case.ts
- [x] T030 [US4] Implement GetLoyaltyAccountUseCase retrieving history and current balance in apps/backend/src/application/use-cases/loyalty/get-loyalty-account.use-case.ts
- [x] T031 [US4] Implement GET and POST adjust endpoints in apps/backend/src/infrastructure/controllers/loyalty.controller.ts
- [x] T032 [US4] Create Angular LoyaltyHistoryComponent component to list transactions in apps/frontend/src/app/features/loyalty/components/loyalty-history/
- [x] T033 [US4] Integrate LoyaltyHistoryComponent in Customer Detail page in apps/frontend/src/app/features/customers/pages/customer-detail/

**Checkpoint**: Audit ledger and manual adjustments are fully operational.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Refinamentos, integrações transversais (RMA), segurança e verificações finais.

- [ ] T034 [P] Implement automatic points reversal in EarnPointsUseCase when a sale is returned/refunded via RMA in ReturnOrdersModule
- [ ] T035 [P] Audit logs generation for manual points adjustments in AuditLogsService
- [ ] T036 Code cleanup and strict TypeScript verification across all modified files
- [ ] T037 Run quickstart.md validation checklist and verify all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all User Stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion.
  - Sprints can proceed sequentially in priority order (P1 → P2 → P3).
- **Polish (Phase 7)**: Depends on all User Stories being complete.

### Parallel Opportunities

- Setup tasks T001, T002, T003 can run in parallel.
- Foundational tasks T006 and T007 can run in parallel.
- Model entities T008, T015 can be defined in parallel.
- Frontend components T024, T025, T032 can be laid out in parallel.

---

## Parallel Example: User Story 3

```bash
# Launch models and DTO files for User Story 3 in parallel:
Task: "Create RedeemPointsDto class in apps/backend/src/infrastructure/dtos/loyalty/redeem-points.dto.ts"
Task: "Create Angular LoyaltyBadgeComponent in apps/frontend/src/app/features/loyalty/components/loyalty-badge/"
```

---

## Implementation Strategy

### MVP First (Config + Earnings Only)

1. Complete Setup and Foundational phases.
2. Complete User Story 1 (Admin Config) and User Story 2 (Auto Earnings).
3. **Validate MVP**: Create sales and check points are generated.
4. Add User Story 3 (PDV Resgate) and User Story 4 (Ajustes/Extrato) sequentially.
