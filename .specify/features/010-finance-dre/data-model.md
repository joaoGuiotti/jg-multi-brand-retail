# Data Model: Financeiro Completo

## Entities

### `FinancialAccount`
- `id`: String (UUID, PK)
- `tenant_id`: String (FK to Tenant)
- `type`: Enum (`PAYABLE`, `RECEIVABLE`)
- `description`: String
- `amount`: Decimal(10, 2)
- `due_date`: DateTime
- `paid_at`: DateTime?
- `status`: Enum (`PENDING`, `PAID`, `OVERDUE`, `CANCELLED`)
- `category`: String (e.g., `SUPPLIER`, `RENT`, `SALE`)
- `sale_id`: String? (FK to Sale, nullable)
- `created_at`, `updated_at`: DateTime

### `SaleItem` (Update existing)
- Add field `cost_price_at_sale`: Decimal(10, 2) - to make CMV calculation immutable.

## Relationships
- `FinancialAccount` belongs to `Tenant`.
- `FinancialAccount` belongs to `Sale` (optional, for receivables).
- `SaleItem` stores the cost price directly, independent of the `Product` entity's current cost price.
