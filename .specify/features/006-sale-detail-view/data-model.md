# Data Model: Sale Detail View

**Feature**: `006-sale-detail-view`  
**Date**: 2026-05-15

## Entidades Envolvidas (existentes — sem criação de novas tabelas)

### Sale (Venda)
Entidade central. **Sem alteração de schema** — apenas inclusão de relações no `include` do Prisma.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `tenantId` | UUID | Isolamento multi-tenant |
| `userId` | UUID | FK → User |
| `customerId` | UUID? | FK → Customer (opcional) |
| `invoiceNumber` | string? | Número sequencial da nota |
| `subtotal` | Decimal | Soma dos itens antes de descontos |
| `discount` | Decimal | Desconto global da venda |
| `total` | Decimal | Valor final |
| `status` | enum | `PENDING \| COMPLETED \| CANCELLED \| RETURN_REQUESTED \| RETURNED` |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### SaleItem (Item da Venda)
Já retornado. **Sem alteração.**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `saleId` | UUID | FK → Sale |
| `productId` | UUID | FK → Product |
| `quantity` | int | |
| `unitPrice` | Decimal | Preço no momento da venda |
| `discount` | Decimal | Desconto por item |
| `total` | Decimal | `(unitPrice - discount) * quantity` |
| `product` | relation | `{ name, sku }` incluído via Prisma include |

### Payment (Pagamento)
**Atualmente ausente no `SaleOutput`** — será adicionado.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `saleId` | UUID | FK → Sale |
| `tenantId` | UUID | Isolamento multi-tenant |
| `method` | enum | `CASH \| PIX \| CREDIT_CARD \| DEBIT_CARD \| STORE_CREDIT` |
| `amount` | Decimal | Valor deste pagamento |
| `status` | enum | `PENDING \| PAID \| CANCELLED` |
| `installments` | int? | Número de parcelas (se cartão) |
| `createdAt` | DateTime | |

### ReturnOrder (Devolução — Resumo)
**Atualmente ausente no `SaleOutput`** — será adicionado como resumo.

| Campo incluído | Tipo | Notas |
|----------------|------|-------|
| `id` | UUID | PK |
| `status` | enum | `REQUESTED \| APPROVED \| REJECTED \| REFUNDED` |
| `total` | Decimal | Valor total da devolução |
| `createdAt` | DateTime | |

> **Nota**: Apenas esses 4 campos são incluídos na resposta do `GET /sales/:id`. O detalhamento completo do ReturnOrder permanece no módulo RMA (`GET /returns/:id`).

---

## Extensões de Tipo (TypeScript)

### Backend — `SaleOutput` (apps/backend)

```typescript
// apps/backend/src/application/use-cases/sales/common/sale-output.ts
export type PaymentOutput = {
  id: string;
  method: string;
  amount: number;
  status: string;
  installments?: number | null;
  createdAt?: Date;
};

export type ReturnSummaryOutput = {
  id: string;
  status: string;
  total: number;
  createdAt?: Date;
};

export type SaleOutput = {
  // campos existentes...
  payments: PaymentOutput[];       // NOVO
  returns: ReturnSummaryOutput[];  // NOVO
};
```

### Frontend — `Sale` model (apps/frontend)

O `Sale` model já tem `payments: Payment[]` — **sem alteração necessária**.  
Adicionar `returns?: ReturnSummary[]` para as devoluções associadas:

```typescript
// apps/frontend/src/app/core/models/sale.model.ts
export interface ReturnSummary {
  id: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  total: number;
  createdAt: string;
}

export interface Sale {
  // campos existentes...
  returns?: ReturnSummary[];  // NOVO
}
```

---

## State Transitions — Visibilidade do Botão "Iniciar Devolução"

```
Sale.status === 'COMPLETED'
  AND NOT sale.returns.some(r => ['REQUESTED', 'APPROVED'].includes(r.status))
  → Botão "Iniciar Devolução" ATIVO

Sale.status === 'COMPLETED'
  AND sale.returns.some(r => ['REQUESTED', 'APPROVED'].includes(r.status))
  → Botão "Iniciar Devolução" DESABILITADO (tooltip: "Devolução em andamento")

Sale.status !== 'COMPLETED'
  → Botão "Iniciar Devolução" OCULTO
```
