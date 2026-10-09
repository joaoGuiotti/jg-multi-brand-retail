# API Contract: Venda com Detalhamento de Devoluções

**Feature**: `014-sale-detail-returns`  
**Endpoint**: `GET /api/v1/sales/:id`  
**Autenticação**: Bearer JWT (Roles: `ADMIN`, `USER`)  

---

## 1. Response Payload (200 OK)

```json
{
  "id": "e5f5f190-b184-48de-8ef7-111166669999",
  "tenantId": "t-retail-brand-1",
  "userId": "u-cashier-01",
  "customerId": "c-customer-12",
  "customerName": "Maria Silva",
  "invoiceNumber": "INV-2026-0042",
  "subtotal": 250.00,
  "discount": 10.00,
  "total": 240.00,
  "status": "COMPLETED",
  "items": [
    {
      "id": "item-01",
      "productId": "prod-10",
      "product": {
        "id": "prod-10",
        "name": "Camiseta Básica Algodão",
        "sku": "CAM-ALG-001"
      },
      "quantity": 2,
      "unitPrice": 80.00,
      "discount": 0,
      "total": 160.00
    },
    {
      "id": "item-02",
      "productId": "prod-20",
      "product": {
        "id": "prod-20",
        "name": "Calça Jeans Slim",
        "sku": "CAL-JNS-002"
      },
      "quantity": 1,
      "unitPrice": 90.00,
      "discount": 10.00,
      "total": 80.00
    }
  ],
  "payments": [
    {
      "id": "pay-01",
      "method": "CREDIT_CARD",
      "amount": 240.00,
      "status": "PAID",
      "installments": 2,
      "createdAt": "2026-10-09T10:00:00.000Z"
    }
  ],
  "returns": [
    {
      "id": "ret-01",
      "status": "REFUNDED",
      "refundType": "STORE_CREDIT",
      "reason": "Tamanho inadequado para o cliente",
      "total": 80.00,
      "createdAt": "2026-10-09T10:30:00.000Z",
      "items": [
        {
          "id": "ret-item-01",
          "productId": "prod-10",
          "productName": "Camiseta Básica Algodão",
          "sku": "CAM-ALG-001",
          "quantity": 1,
          "unitPrice": 80.00,
          "total": 80.00,
          "condition": "GOOD"
        }
      ]
    }
  ],
  "createdAt": "2026-10-09T10:00:00.000Z",
  "updatedAt": "2026-10-09T10:30:00.000Z"
}
```

---

## 2. Tratamento de Erros

- `401 Unauthorized`: Token JWT ausente ou expirado.
- `403 Forbidden`: Usuário não pertence ao `tenantId` da venda.
- `404 Not Found`: Venda não encontrada para o tenant especificado.
