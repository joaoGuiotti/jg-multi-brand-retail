# API Contract: Sale Detail View

**Feature**: `006-sale-detail-view`  
**Version**: v1  
**Date**: 2026-05-15

## Endpoint Modificado

### `GET /api/v1/sales/:id`

Endpoint existente. **Sem alteração na rota ou método** — apenas extensão do payload de resposta.

#### Request

```
GET /api/v1/sales/:id
Authorization: Bearer <access_token>
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | UUID (path) | ✅ | ID da venda |

#### Response 200 — Antes (atual)

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "customerId": null,
  "customerName": null,
  "invoiceNumber": "INV-0001",
  "subtotal": 150.00,
  "discount": 10.00,
  "total": 140.00,
  "status": "COMPLETED",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "product": { "name": "Produto A", "sku": "SKU-001" },
      "quantity": 2,
      "unitPrice": 75.00,
      "discount": 0,
      "total": 150.00
    }
  ],
  "createdAt": "2026-05-15T12:00:00.000Z",
  "updatedAt": "2026-05-15T12:00:00.000Z"
}
```

#### Response 200 — Depois (com esta feature) ✅

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "customerId": null,
  "customerName": null,
  "invoiceNumber": "INV-0001",
  "subtotal": 150.00,
  "discount": 10.00,
  "total": 140.00,
  "status": "COMPLETED",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "product": { "name": "Produto A", "sku": "SKU-001" },
      "quantity": 2,
      "unitPrice": 75.00,
      "discount": 0,
      "total": 150.00
    }
  ],
  "payments": [
    {
      "id": "uuid",
      "method": "PIX",
      "amount": 100.00,
      "status": "PAID",
      "installments": null,
      "createdAt": "2026-05-15T12:01:00.000Z"
    },
    {
      "id": "uuid",
      "method": "CASH",
      "amount": 40.00,
      "status": "PAID",
      "installments": null,
      "createdAt": "2026-05-15T12:01:05.000Z"
    }
  ],
  "returns": [
    {
      "id": "uuid",
      "status": "REQUESTED",
      "total": 75.00,
      "createdAt": "2026-05-15T14:00:00.000Z"
    }
  ],
  "createdAt": "2026-05-15T12:00:00.000Z",
  "updatedAt": "2026-05-15T12:00:00.000Z"
}
```

#### Campos novos na resposta

| Campo | Tipo | Notas |
|-------|------|-------|
| `payments` | `PaymentSummary[]` | Array vazio `[]` se nenhum pagamento |
| `payments[].method` | string | `CASH \| PIX \| CREDIT_CARD \| DEBIT_CARD \| STORE_CREDIT` |
| `payments[].amount` | number | Serializado como número (não Decimal) |
| `payments[].status` | string | `PENDING \| PAID \| CANCELLED` |
| `payments[].installments` | number \| null | Presente apenas para CREDIT_CARD |
| `returns` | `ReturnSummary[]` | Array vazio `[]` se nenhuma devolução |
| `returns[].status` | string | `REQUESTED \| APPROVED \| REJECTED \| REFUNDED` |
| `returns[].total` | number | Valor total da devolução |

#### Response 404 — Venda não encontrada

```json
{
  "statusCode": 404,
  "message": "Sale not found",
  "error": "Not Found"
}
```

#### Response 403 — Acesso negado (tenant errado)

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Endpoints Não Modificados

Os seguintes endpoints existentes são **utilizados** por esta feature, mas **não modificados**:

| Endpoint | Uso |
|----------|-----|
| `POST /api/v1/returns` | Destino do botão "Iniciar Devolução" (navegação frontend) |
| `GET /api/v1/sales` | Lista de vendas — ponto de entrada para o modal de detalhes |
