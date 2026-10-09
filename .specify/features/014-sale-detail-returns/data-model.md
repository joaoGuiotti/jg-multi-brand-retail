# Data Model: Detalhamento de Devoluções na Modal de Venda

**Feature**: `014-sale-detail-returns`  
**Date**: 2026-10-09  

---

## 1. Entidades e Tipos de Domínio

### 1.1 ReturnItemSummary
Representa cada produto físico contido dentro de uma devolução associada à venda.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único do item devolvido (UUID) |
| `productId` | `string` | Identificador do produto devolvido |
| `productName` | `string` (opcional) | Nome de exibição do produto |
| `sku` | `string` (opcional) | Código SKU do produto |
| `quantity` | `number` | Quantidade de unidades devolvidas |
| `unitPrice` | `number` | Preço unitário faturado do item |
| `total` | `number` | Valor total da linha de devolução (`quantity * unitPrice`) |
| `condition` | `'GOOD' \| 'DAMAGED' \| 'DEFECTIVE'` | Estado físico do item devolvido |

### 1.2 ReturnSummary (Enriquecido)
Representa uma ordem de devolução vinculada à venda.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único da devolução |
| `status` | `'REQUESTED' \| 'APPROVED' \| 'REFUNDED' \| 'REJECTED'` | Estado atual da devolução |
| `refundType` | `'STORE_CREDIT' \| 'CASH_REFUND' \| 'EXCHANGE'` (opcional) | Tipo de estorno ou compensação financeira |
| `reason` | `string \| null` (opcional) | Motivo ou observação da devolução |
| `total` | `number` | Valor total reembolsado nesta devolução |
| `createdAt` | `string` | Data e hora ISO da criação |
| `items` | `ReturnItemSummary[]` (opcional) | Lista dos itens físicos pertencentes à devolução |

### 1.3 Sale (Aggregate com Returns)
Representa a venda completa retornada em `GET /sales/:id`.

```typescript
export interface Sale {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'RETURN_REQUESTED' | 'RETURNED' | 'CANCELLED';
  items: SaleItem[];
  payments: Payment[];
  returns?: ReturnSummary[];
  userId: string;
  tenantId: string;
  customerId?: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Mapeamento de Estados e Badges Visuais

### Status da Devolução (`ReturnStatus`)
- `REQUESTED` ➔ Variante: `warning` (Badge Amarelo: "Solicitado")
- `APPROVED` ➔ Variante: `info` (Badge Azul: "Aprovado")
- `REFUNDED` ➔ Variante: `success` (Badge Verde: "Reembolsado")
- `REJECTED` ➔ Variante: `error` (Badge Vermelho: "Rejeitado")

### Condição do Item (`ReturnItemCondition`)
- `GOOD` ➔ Variante: `success` ("Bom Estado")
- `DAMAGED` ➔ Variante: `warning` ("Avariado")
- `DEFECTIVE` ➔ Variante: `error` ("Com Defeito")

### Modalidade de Reembolso (`RefundType`)
- `STORE_CREDIT` ➔ "Crédito em Loja"
- `CASH_REFUND` ➔ "Estorno Financeiro"
- `EXCHANGE` ➔ "Troca por Mercadoria"
