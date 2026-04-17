# Implementation Plan: RMA Management

**Branch**: `004-rma-management` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-rma-management/spec.md`

## Summary

Implement a full Return Merchandise Authorization (RMA) workflow. Salespeople initiate return requests for completed sales, specifying items and quantities. Admins receive real-time notifications and can approve or reject requests. Approval triggers automatic inventory restocking and refund processing (Store Credit, Cash, or Exchange).

## Technical Context

**Language/Version**: Node.js 20+ (TypeScript 5.x)
**Primary Dependencies**: NestJS (Backend), Angular 17+ (Frontend), Prisma ORM, Tailwind CSS.  
**Storage**: PostgreSQL 15+, Redis 7+ (for BullMQ/Caching).  
**Testing**: Jest (Backend unit/integration), Jasmine/Karma (Frontend).  
**Target Platform**: Multi-tenant SaaS Web Application.
**Project Type**: Monorepo Web Application.  
**Performance Goals**: Real-time admin notifications (<2s), Inventory update upon approval (<500ms).  
**Constraints**: Strict multi-tenancy (tenant_id), RBAC enforcement (ADMIN approval only).  
**Scale/Scope**: Support for partial returns, traceability back to original sale items.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Multi-Tenancy**: All new tables (`ReturnOrder`, `ReturnItem`) HAVE `tenant_id`. Prisma queries MUST include `tenantId`.
- **RBAC**: `ReturnOrder.approvedBy` and endpoints MUST be restricted to `ADMIN`.
- **Type-Safety**: Enums `ReturnStatus` and `RefundType` defined in Prisma. Shared DTOs in `libs/shared`.
- **Observability**: `approvedAt` and `processedAt` fields added to `ReturnOrder` for auditability.
- **Simplicity**: Using Angular Signals in `ReturnsStore` as per Principle V.

## Project Structure

### Documentation (this feature)

```text
specs/004-rma-management/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Prisma schema and entities
├── quickstart.md        # Setup guide
├── contracts/           # API definitions
└── tasks.md             # Execution steps
```

### Source Code (repository root)

```text
apps/backend/src/
├── domain/entities/returns/
├── domain/repositories/returns/
├── application/use-cases/returns/
├── infrastructure/
│   ├── persistence/returns/
│   ├── controllers/returns.controller.ts
│   ├── dtos/returns/
│   └── modules/returns.module.ts

apps/frontend/src/app/features/returns/
├── pages/
│   ├── return-list/
│   └── return-form/
├── components/
├── services/
└── store/
```

**Structure Decision**: Monorepo structure with three layers (Domain, Application, Infrastructure). Frontend grouped by feature.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |
