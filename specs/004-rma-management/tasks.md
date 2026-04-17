# Tasks: RMA Management Module

**Input**: Design documents from `/specs/004-rma-management/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-v1.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and core schema setup

- [ ] T001 Create project structure per implementation plan in specs/004-rma-management/plan.md
- [ ] T002 Extend Prisma schema with ReturnOrder and ReturnItem models in apps/backend/prisma/schema.prisma
- [ ] T003 [P] Generate Prisma client and update backend services

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain and application layers required by all user stories

- [ ] T004 Define ReturnOrder and ReturnItem domain entities in apps/backend/src/domain/entities/returns/
- [ ] T005 [P] Create IReturnsRepository interface in apps/backend/src/domain/repositories/returns/
- [ ] T006 [P] Define shared DTOs for returns in libs/shared/src/dtos/returns/
- [ ] T007 Implement PrismaReturnsRepository in apps/backend/src/infrastructure/persistence/returns/
- [ ] T008 [P] Register ReturnsModule and its providers in apps/backend/src/infrastructure/modules/returns.module.ts

---

## Phase 3: User Story 1 - Salesperson requests a return (Priority: P1) 🎯 MVP

**Goal**: Enable salespeople to find a completed sale and submit a return request.

**Independent Test**: Create a COMPLETED sale, initiate a return via the UI, and verify a REQUESTED ReturnOrder exists in the DB.

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create CreateReturnUseCase in apps/backend/src/application/use-cases/returns/create-return.use-case.ts
- [ ] T010 [US1] Implement POST /api/v1/returns endpoint in apps/backend/src/infrastructure/controllers/returns.controller.ts
- [ ] T011 [P] [US1] Create ReturnsService in apps/frontend/src/app/features/returns/services/returns.service.ts
- [ ] T012 [P] [US1] Setup ReturnsStore with Angular Signals in apps/frontend/src/app/features/returns/store/returns.store.ts
- [ ] T013 [US1] Implement ReturnFormComponent (Wizard) in apps/frontend/src/app/features/returns/pages/return-form/
- [ ] T014 [US1] Create ReturnItemSelectorComponent in apps/frontend/src/app/features/returns/components/return-item-selector/
- [ ] T015 [US1] Add "Iniciar Devolução" button to SaleDetail page in apps/frontend/src/app/features/sales/pages/sale-detail/

**Checkpoint**: User Story 1 functional: Returns can be requested and persisted.

---

## Phase 4: User Story 2 - Admin manages return approvals (Priority: P1)

**Goal**: Enable admins to approve/reject returns with automatic inventory and notification updates.

**Independent Test**: Approve a return as ADMIN and verify stock levels increased in the product inventory.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Create ApproveReturnUseCase in apps/backend/src/application/use-cases/returns/approve-return.use-case.ts
- [ ] T017 [US2] Integrate InventoryRepository in ApproveReturnUseCase to generate movements
- [ ] T018 [P] [US2] Create RejectReturnUseCase in apps/backend/src/application/use-cases/returns/reject-return.use-case.ts
- [ ] T019 [US2] Implement PATCH /:id/status endpoint in ReturnsController
- [ ] T020 [US2] Create ReturnListComponent with status filters in apps/frontend/src/app/features/returns/pages/return-list/
- [ ] T021 [US2] Implement ReturnStatusBadgeComponent in apps/frontend/src/app/features/returns/components/return-status-badge/
- [ ] T022 [US2] Implement admin notification broadcast logic in ApproveReturnUseCase using NotificationsModule

**Checkpoint**: User Story 2 functional: Admins can process returns and inventory is updated.

---

## Phase 5: User Story 3 - Refund Processing (Priority: P2)

**Goal**: Finalize the return by processing the refund amount and type.

**Independent Test**: Process a refund and verify the status is updated to REFUNDED with the correct total.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create ProcessRefundUseCase in apps/backend/src/application/use-cases/returns/process-refund.use-case.ts
- [ ] T024 [US3] Implement PATCH /:id/refund endpoint in ReturnsController
- [ ] T025 [US3] Create ReturnSummaryComponent in apps/frontend/src/app/features/returns/components/return-summary/

**Checkpoint**: All user stories functional.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Add structured logging for status transitions and stock adjustments (Audit Trail)
- [ ] T027 Ensure strict tenant_id scoping in all new Prisma queries
- [ ] T028 Run quickstart.md validation to ensure end-to-end flow works

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Core prerequisite.
- **Foundational (Phase 2)**: Depends on schema completion. BLOCKS all logic.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on US1 (needs requests to approve).
- **US3 (Phase 5)**: Depends on US2 (needs approved returns to refund).

### Parallel Opportunities
- T011, T012, T013 can be done in parallel with backend use cases T009.
- Frontend components marked [P] can be developed as soon as shared types (T006) are ready.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. Complete Setup and Foundational.
2. Implement US1 to allow data entry.
3. Implement US2 to allow the core business action (Stock replenishment).
4. **Validation**: Test stock replenishment end-to-end.

## Notes
- [P] tasks = different files, no dependencies.
- [Story] label for traceability.
- Verify inventory movement types match existing code in `InventoryModule`.
