# Phase 0: Research & Architecture Decisions
**Feature**: Comissionamento Inteligente (% Fixa)
**Date**: 2026-06-02

## 1. Storage of Commission Config per Tenant
- **Decision**: Add `fixedCommissionRate` (Decimal) to `Tenant` table or create `TenantSettings` table. We will add `commissionRate` (Decimal) to the existing `Tenant` table since it's a 1:1 scalar value and `Tenant` is already loaded in context.
- **Rationale**: Simplest approach for v1. No need to overcomplicate with a separate table if it's just one field.
- **Alternatives**: Separate `CommissionConfig` table. (Rejected for YAGNI).

## 2. Sales Targets
- **Decision**: Create `SalesTarget` entity (`tenantId`, `userId`, `month`, `year`, `amountTarget`).
- **Rationale**: Provides historical tracking of targets per month. Allows setting different targets for different months.
- **Alternatives**: Just one global target per user. (Rejected because targets change seasonally).

## 3. Commission Transactions
- **Decision**: Create `CommissionTransaction` entity (`id`, `tenantId`, `userId`, `saleId`, `amount`, `percentageApplied`, `status`, `createdAt`).
- **Rationale**: Auditability is critical for financial features. Must know exactly which sale generated which commission and at what rate.
- **Alternatives**: Calculate on the fly. (Rejected because rates change over time, and returns must reverse specific commissions).

## 4. Triggering the Calculation
- **Decision**: Publish a domain event `SaleCompletedEvent` from `CompleteSaleUseCase`. A new handler `CalculateCommissionHandler` will listen to this event and create the `CommissionTransaction`.
- **Rationale**: Decouples the core sales checkout logic from the commission calculation, keeping `CompleteSaleUseCase` fast and focused on its primary domain.
- **Alternatives**: Call `CommissionService` directly inside `CompleteSaleUseCase`. (Rejected because it increases coupling).
