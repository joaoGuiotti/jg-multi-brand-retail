# Data Model: RMA Management

## Prisma Schema

```prisma
enum ReturnStatus {
  REQUESTED
  APPROVED
  REFUNDED
  REJECTED
}

enum RefundType {
  STORE_CREDIT
  CASH_REFUND
  EXCHANGE
}

model ReturnOrder {
  id          String       @id @default(uuid())
  tenantId    String       @map("tenant_id")
  saleId      String       @map("sale_id")
  userId      String       @map("user_id")
  customerId  String?      @map("customer_id")
  status      ReturnStatus @default(REQUESTED)
  refundType  RefundType   @map("refund_type")
  reason      String?
  totalRefund Decimal      @map("total_refund") @db.Decimal(10, 2)
  approvedBy  String?      @map("approved_by")
  approvedAt  DateTime?    @map("approved_at")
  processedAt DateTime?    @map("processed_at")
  createdAt   DateTime     @default(now()) @map("created_at")

  tenant   Tenant       @relation(fields: [tenantId], references: [id])
  sale     Sale         @relation(fields: [saleId], references: [id])
  user     User         @relation(fields: [userId], references: [id], name: "CreatedReturns")
  approver User?        @relation(fields: [approvedBy], references: [id], name: "ApprovedReturns")
  customer Customer?    @relation(fields: [customerId], references: [id])
  items    ReturnItem[]

  @@index([tenantId])
  @@index([saleId])
  @@map("return_orders")
}

model ReturnItem {
  id            String  @id @default(uuid())
  returnOrderId String  @map("return_order_id")
  productId     String  @map("product_id")
  quantity      Int
  unitPrice     Decimal @map("unit_price") @db.Decimal(10, 2)
  total         Decimal @db.Decimal(10, 2)
  condition     String  @default("GOOD") // "GOOD" | "DAMAGED" | "DEFECTIVE"

  returnOrder ReturnOrder @relation(fields: [returnOrderId], references: [id], onDelete: Cascade)
  product     Product     @relation(fields: [productId], references: [id])

  @@index([returnOrderId])
  @@map("return_items")
}
```

## Entity Relationships

- **ReturnOrder (1) -> (*) ReturnItem**: Cascade delete on items.
- **Sale (1) -> (*) ReturnOrder**: One sale can have multiple partial returns.
- **Tenant (1) -> (*) ReturnOrder**: Mandatory multi-tenancy.
- **User (1) -> (*) ReturnOrder**: Track requester.
- **User? (1) -> (*) ReturnOrder**: Track approver.

## Lifecycle States

1.  **REQUESTED**: Created by salesperson. Pending admin review.
2.  **APPROVED**: Admin verified condition and approved restock. Trigger inventory movement.
3.  **REJECTED**: Admin denied return (e.g., condition not as described).
4.  **REFUNDED**: Financial processing complete (Store Credit/Cash/Exchange).
