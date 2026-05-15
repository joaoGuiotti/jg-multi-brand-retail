# Tasks: Sale Detail View

**Input**: Design documents from `006-sale-detail-view`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-v1.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

*(No structural setup required as this feature extends existing components and endpoints).*

---

## Phase 2: Foundational (Backend Data Extensions)

**Purpose**: Update backend to include `payments` and `returns` in the sale details endpoint, establishing the contract for frontend.

- [x] T001 [P] Extend `SaleOutput` and `SaleOutputMapper` to include `payments` and `returns` in `apps/backend/src/application/use-cases/sales/common/sale-output.ts`
- [x] T002 [P] Extend `Sale` interface to include `ReturnSummary` array in `apps/frontend/src/app/core/models/sale.model.ts`
- [x] T003 Update Prisma query `findById` to `include` payments and returnOrders in `apps/backend/src/infrastructure/persistence/sales/prisma-sale.repository.ts`
- [x] T004 Update `SalePresenter` to serialize `payments` and `returns` in `apps/backend/src/infrastructure/presenters/sale.presenter.ts`

---

## Phase 3: User Story 1 & 3 - Consultar Detalhes e Resumo Financeiro (Priority: P1/P2)

**Goal**: Ensure the existing modal correctly receives and renders the new payments data, closing the loop for complete sale visibility.

**Independent Test**: Open a completed sale and verify payments are displayed alongside items and the financial summary.

- [x] T005 [US1] Adjust payments rendering (if necessary to match the backend payload) in `apps/frontend/src/app/features/sales/components/sale-detail-modal/sale-detail-modal.component.html`

---

## Phase 4: User Story 2 - Iniciar Devolução a Partir da Venda (Priority: P1)

**Goal**: Allow salespeople to initiate a return directly from the sale details modal, showing associated returns if they exist.

**Independent Test**: Open a completed sale, click "Iniciar Devolução", and verify it navigates to the RMA form with the `saleId` parameter.

- [x] T006 [P] [US2] Inject `Router` and implement `initiateReturn(saleId)` method with status validation in `apps/frontend/src/app/features/sales/components/sale-detail-modal/sale-detail-modal.component.ts`
- [x] T007 [US2] Add "Devoluções Associadas" UI section and conditionally display the "Iniciar Devolução" button in `apps/frontend/src/app/features/sales/components/sale-detail-modal/sale-detail-modal.component.html`

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T008 Run quickstart.md validation to ensure end-to-end flow works seamlessly

---

## Dependencies & Execution Order

### Phase Dependencies
- **Foundational (Phase 2)**: BLOCKS all UI testing and subsequent logic.
- **US1 & US3 (Phase 3)**: Depends on Foundational (needs backend data).
- **US2 (Phase 4)**: Depends on US1 (needs the modal functioning with current state).

### Parallel Opportunities
- T001 and T002 can be done in parallel as they touch different layers.
- T006 can be started while backend (Phase 2) is being finished, since the contract is known.

## Implementation Strategy

1. Complete backend foundational tasks to feed the frontend with `payments` and `returns`.
2. Verify the existing modal correctly parses the new payload.
3. Add the new RMA button and associated returns section to complete the UX.
