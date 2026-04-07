# Tasks: CI/CD Pipeline

**Input**: Design documents from `.specify/features/002-ci-cd-pipeline/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/

**Tests**: Tests are explicitly OPTIONAL/Not Applicable for github workflows (tested manually by triggers, as instructed in quickstart.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **CI/CD Configuration**: `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize the empty workflow file `.github/workflows/ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- *(This feature provides independent CI tasks, so there are no blocking programmatic configurations beyond T001).*

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Automated Build and Test on Push (Priority: P1) 🎯 MVP

**Goal**: Establish an automated CI/CD pipeline triggered on `main` and `main-sdd` pushes that enforces code verification (lint/test/build) for both backend and frontend applications.

**Independent Test**: Can be tested independently by pushing a dummy commit to `main-sdd` and verifying GitHub Actions successfully executes the separated jobs and fails appropriately when forced.

### Implementation for User Story 1

- [x] T002 [US1] Add GitHub workflow triggers (`on: push` to branches `main-sdd`, `main`) into `.github/workflows/ci.yml`
- [x] T003 [US1] Implement `backend-tests` job to run dependency setup, linting, tests, and build via NestJS instructions in `.github/workflows/ci.yml`
- [x] T004 [US1] Implement `frontend-tests` job to run dependency setup, linting, tests, and build via Angular instructions in `.github/workflows/ci.yml`
- [x] T005 [US1] Implement `build-validation` job relying on both backend and frontend jobs completing successfully in `.github/workflows/ci.yml`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently in GitHub Actions.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T006 Add `actions/cache` logic for `node_modules` across the `backend-tests` and `frontend-tests` jobs in `.github/workflows/ci.yml` to speed up workflow execution
- [x] T007 Run quickstart.md scenario to validate GitHub actions log execution

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A
- **User Stories (Phase 3+)**: Setup must be completed
- **Polish (Final Phase)**: Depends on US1 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Only relies on T001 setup task

### Parallel Opportunities

- Due to being a singular workflow file, the tasks are inherently sequential per file logic, preventing safe parallel writing.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (Core Pipeline logic)
3. **STOP and VALIDATE**: Push a test commit simulating User Story 1 execution
4. Complete Polish Actions for speed enhancements
