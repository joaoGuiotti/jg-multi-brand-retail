---
description: "Task list template for feature implementation"
---

# Tasks: Real-Time Notifications & Alerts

**Input**: Design documents from `/specs/003-sprint1-notifications/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/events.md

**Tests**: Tests are generated for foundational logic as prescribed by architecture best practices.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/` and `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Install `socket.io` and `@nestjs/platform-socket.io` packages in backend
- [x] T002 Install `socket.io-client` package in frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Update database schema in `backend/prisma/schema.prisma` with `Notification` and `NotificationPreference` models and enums
- [x] T004 Generate and run Prisma migrations to apply schema updates
- [x] T005 [P] Create domain entities `notification.entity.ts` and `notification-preference.entity.ts` in `backend/src/domain/entities/notifications/`
- [x] T006 [P] Create repository interface `notifications.repository.interface.ts` in `backend/src/domain/repositories/notifications/`
- [x] T007 Implement `PrismaNotificationsRepository` adhering to interface in `backend/src/infrastructure/persistence/notifications/prisma-notifications.repository.ts`
- [x] T008 Scaffold and register `NotificationsModule` in `backend/src/infrastructure/modules/notifications.module.ts` (and link to `AppModule`)

**Checkpoint**: Foundation ready - DB is configured, models are created. User story implementation can now begin.

---

## Phase 3: User Story 1 - Real-Time Notification Receipt & Management (Priority: P1) 🎯 MVP

**Goal**: Deliver bidirectional real-time user notification flows, from generation to front-end reception and marking read.

**Independent Test**: Trigger a notification in the backend via HTTP test call, and observe the bell counter increment on the frontend without refresh.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create DTOs `create-notification.dto.ts` and `notification-filters.dto.ts` in `backend/src/infrastructure/dtos/notifications/`
- [x] T010 [US1] Implement use cases `create-notification`, `mark-as-read`, `mark-all-as-read`, and `get-user-notifications` in `backend/src/application/use-cases/notifications/`
- [x] T011 [US1] Create `NotificationsGateway` (WebSocket) with JWT handshake, room assignment by tenant/user, and `mark_as_read` handler in `backend/src/infrastructure/gateways/notifications.gateway.ts`
- [x] T012 [US1] Create `NotificationDispatcherService` to orchestrate generic DB saving and event emissions to the Gateway in `backend/src/infrastructure/services/notification-dispatcher.service.ts`
- [x] T013 [US1] Create `NotificationsController` with REST endpoints mapping to the use cases in `backend/src/infrastructure/controllers/notifications.controller.ts`
- [x] T014 [P] [US1] Create HTTP client `NotificationsService` in `frontend/src/app/features/notifications/services/notifications.service.ts`
- [x] T015 [US1] Create WebSocket client `NotificationsWsService` interacting with the backend Gateway in `frontend/src/app/features/notifications/services/notifications-ws.service.ts`
- [x] T016 [US1] Create Angular Signal Store `NotificationsStore` to manage read/unread state in `frontend/src/app/features/notifications/store/notifications.store.ts`
- [x] T017 [P] [US1] Develop `NotificationBellComponent` displaying unread signal logic in `frontend/src/app/features/notifications/components/notification-bell/notification-bell.component.ts`
- [x] T018 [P] [US1] Develop `NotificationItemComponent` to render visual states of individual messages in `frontend/src/app/features/notifications/components/notification-item/notification-item.component.ts`
- [x] T019 [US1] Develop `NotificationPanelComponent` orchestrating a dropdown list of recent items in `frontend/src/app/features/notifications/components/notification-panel/notification-panel.component.ts`
- [x] T020 [US1] Integrate `NotificationBellComponent` into the main application global header layout

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. You have functioning notifications.

---

## Phase 4: User Story 2 - Critical Alert Overlays and Sounds (Priority: P1)

**Goal**: Extend US1 to actively grab user attention with visual overlays/toasts and sound based on notification priority.

**Independent Test**: Emit a HIGH/CRITICAL notification to the websocket room, ensure it visually interrupts the screen and plays a tone.

### Implementation for User Story 2

- [x] T021 [P] [US2] Update `NotificationsWsService` to trigger Audio API sound execution on specific payload priorities in `frontend/src/app/features/notifications/services/notifications-ws.service.ts`
- [x] T022 [US2] Hook `NotificationsWsService` into the frontend global Toast/Snackbar ecosystem to spawn visually distinct overlays when HIGH/CRITICAL events arrive.

**Checkpoint**: At this point, alerts force awareness on critical priorities.

---

## Phase 5: User Story 3 - Notification Preferences Configuration (Priority: P2)

**Goal**: Give the user control over which notifications they want to ignore.

**Independent Test**: Turn off a type toggle, verify that invoking `NotificationDispatcherService` with that type no longer broadcasts the WS event nor registers unread badges.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create `update-preferences.dto.ts` in `backend/src/infrastructure/dtos/notifications/`
- [ ] T024 [P] [US3] Implement `UpdatePreferencesUseCase` in `backend/src/application/use-cases/notifications/update-preferences.use-case.ts`
- [ ] T025 [US3] Extend `NotificationsController` with GET/PUT `/preferences` endpoints in `backend/src/infrastructure/controllers/notifications.controller.ts`
- [ ] T026 [US3] Refactor `NotificationDispatcherService` to load preferences and shortcut exit (discard payload) if user preference has the notification type `enabled: false`
- [ ] T027 [US3] Add preferences API calls to frontend and manage in `NotificationsStore` inside `frontend/src/app/features/notifications/store/notifications.store.ts`
- [ ] T028 [US3] Develop `NotificationSettingsComponent` with toggles for every `NotificationType` enum and one for sound in `frontend/src/app/features/notifications/components/notification-settings/notification-settings.component.ts`

**Checkpoint**: Alert fatigue limits are respected.

---

## Phase 6: User Story 4 - Continuous Operational Event Stream (Priority: P3)

**Goal**: Deliver Server-Sent Events (SSE) feed capabilities for streaming high-volume data cleanly.

**Independent Test**: Connect via browser direct URL or cURL to the `/stream` endpoint and observe chunks streaming back.

### Implementation for User Story 4

- [ ] T029 [P] [US4] Create `NotificationsSseController` implementing `GET /stream` emitting RxJS observables as SSE stream payloads in `backend/src/infrastructure/controllers/notifications-sse.controller.ts`
- [ ] T030 [US4] Expose a `broadcastOperationalAlert` method in `NotificationDispatcherService` routing specific payloads to the SSE subject map instead of the WS gateway.
- [ ] T031 [US4] Provide a frontend SSE consumer component or service integration snippet that hooks into standard Operational Dashboards.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: System scaling, reliability, and automated validations.

- [ ] T032 [P] Implement Redis adapter registration for Socket.IO multi-instance scaling in `backend/src/main.ts` or WS config.
- [ ] T033 [P] Implement Backend Unit Tests guarding the `NotificationDispatcherService` debouncing limits and preference validations.
- [ ] T034 [P] Verify `quickstart.md` examples compile properly and make sense inside `backend/src/application/use-cases/notifications/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US2 directly relies on US1 components (WS Service) being stabilized.
  - US3 (Preferences) and US4 (SSE) can be built in parallel.
- **Polish (Final Phase)**: Can be largely interleaved, but requires core system ready.

### Parallel Opportunities

- **T017** and **T018**: Visual Angular components can be built in parallel layout work before WS stores are complete.
- **T023**, **T024**, **T029**: Secondary DTO and use cases can be developed concurrently by backend devs while frontend devs test US1 Gateway.
