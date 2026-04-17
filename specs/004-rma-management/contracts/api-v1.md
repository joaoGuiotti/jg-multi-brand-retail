# API Contract: RMA v1

Base URL: `/api/v1/returns`

## Endpoints

### 1. Initiate Return
- **Method**: `POST`
- **Path**: `/`
- **Role**: `USER`, `ADMIN`
- **Request Body**:
```json
{
  "saleId": "uuid",
  "refundType": "STORE_CREDIT | CASH_REFUND | EXCHANGE",
  "reason": "optional string",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "condition": "GOOD | DAMAGED | DEFECTIVE"
    }
  ]
}
```

### 2. List Returns
- **Method**: `GET`
- **Path**: `/`
- **Role**: `USER`, `ADMIN` (results filtered by tenant)
- **Filters**: `status`, `saleId`, `customerId`

### 3. Approve/Reject Return
- **Method**: `PATCH`
- **Path**: `/:id/status`
- **Role**: `ADMIN`
- **Request Body**:
```json
{
  "status": "APPROVED | REJECTED",
  "reason": "optional rejection reason"
}
```

### 4. Process Refund
- **Method**: `PATCH`
- **Path**: `/:id/refund`
- **Role**: `ADMIN`
- **Description**: Finalizes the refund process after approval.
