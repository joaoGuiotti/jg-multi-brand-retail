# Phase 1: Data Model & Contracts
**Feature**: Comissionamento Inteligente (% Fixa)
**Date**: 2026-06-02

## Data Model Additions

### `Tenant` (Modification)
- Add `commissionRate` (`Decimal(5,2)?`): The fixed commission percentage applied to all sales in the tenant. Example: `5.00` for 5%.

### `SalesTarget` (New Table)
- `id` (String/UUID, PK)
- `tenantId` (String, FK to Tenant)
- `userId` (String, FK to User)
- `month` (Int, 1-12)
- `year` (Int)
- `targetAmount` (Decimal)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- **Constraints**: Unique compound key `[tenantId, userId, month, year]` to ensure only one target per user per month.

### `CommissionTransaction` (New Table)
- `id` (String/UUID, PK)
- `tenantId` (String, FK to Tenant)
- `userId` (String, FK to User)
- `saleId` (String, FK to Sale)
- `baseAmount` (Decimal): The net value of the sale (Subtotal - Discounts) that the commission was calculated on.
- `percentageApplied` (Decimal): The rate applied at the moment of calculation.
- `commissionAmount` (Decimal): The final earnings (`baseAmount * percentageApplied / 100`).
- `status` (Enum: `PENDING`, `PAID`, `REVERSED`): Starts as PENDING. If sale is returned, goes to REVERSED.
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- **Constraints**: Unique compound key `[tenantId, saleId, userId]` (a sale generates one commission transaction for the seller).

## Contracts (DTOs)

### Backend -> Frontend
- `SalesTargetDto`: `{ id, userId, month, year, targetAmount }`
- `CommissionSummaryDto`: `{ userId, month, year, targetAmount, totalSold, commissionEarned, progressPercentage }`
- `CommissionTransactionDto`: `{ id, saleId, baseAmount, commissionAmount, status, createdAt }`

### Frontend -> Backend
- `UpdateTenantCommissionDto`: `{ commissionRate: number }`
- `SetSalesTargetDto`: `{ userId: string, month: number, year: number, targetAmount: number }`
