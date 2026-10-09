import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { PrismaReturnsRepository } from '../src/infrastructure/persistence/returns/prisma-returns.repository';
import { ReturnOrder } from '../src/domain/entities/returns/return-order.entity';
import { ReturnItem } from '../src/domain/entities/returns/return-item.entity';
import { UniqueEntityID } from '../src/common/domain/unique-entity-id';

const TEST_DB_URL =
  process.env.TEST_DB_URL ||
  'postgresql://postgres:pgtest@localhost:5544/retail_test?schema=public';

describe('Phase 1 Database Integrity & Concurrency Constraints (Integration)', () => {
  let pool: Pool;
  let prisma: PrismaClient;

  let tenantA: string;
  let tenantB: string;
  let userA: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    tenantA = uuidv4();
    tenantB = uuidv4();
    userA = uuidv4();

    // Create test tenants
    await prisma.tenant.createMany({
      data: [
        { id: tenantA, name: 'Tenant Alpha', slug: `tenant-a-${Date.now()}` },
        { id: tenantB, name: 'Tenant Beta', slug: `tenant-b-${Date.now()}` },
      ],
    });

    // Create user in tenant A
    await prisma.user.create({
      data: {
        id: userA,
        tenantId: tenantA,
        email: `usera-${Date.now()}@test.com`,
        passwordHash: 'dummy',
        name: 'User A',
        role: 'USER',
      },
    });
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await prisma.loyaltyTransaction.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.loyaltyAccount.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.saleItem.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.sale.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.customer.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.product.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.user.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.tenant.deleteMany({
        where: { id: { in: [tenantA, tenantB] } },
      });
      await prisma.$disconnect();
      await pool.end();
    } catch {
      // ignore cleanup errors
    }
  });

  const makeCustomerData = (
    tId: string,
    overrides: Record<string, any> = {},
  ) => ({
    tenantId: tId,
    firstName: 'Test',
    lastName: 'Customer',
    email: `cust-${Date.now()}-${Math.random()}@test.com`,
    phone: '11999999999',
    street: 'Rua Teste',
    number: '123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    ...overrides,
  });

  describe('1.1 Customer Document Multi-Tenant Uniqueness', () => {
    it('allows same document in different tenants, but blocks duplicate in same tenant', async () => {
      const doc = '52998224725';

      // Customer 1 in Tenant A
      const cust1 = await prisma.customer.create({
        data: makeCustomerData(tenantA, { document: doc }),
      });
      expect(cust1.id).toBeDefined();

      // Customer 2 in Tenant B with SAME document -> must SUCCEED
      const cust2 = await prisma.customer.create({
        data: makeCustomerData(tenantB, { document: doc }),
      });
      expect(cust2.id).toBeDefined();

      // Duplicate in Tenant A -> must FAIL with unique constraint violation (P2002)
      await expect(
        prisma.customer.create({
          data: makeCustomerData(tenantA, { document: doc }),
        }),
      ).rejects.toThrow();
    });
  });

  describe('1.3 Cross-Tenant Composite Foreign Key Enforcement', () => {
    it('prevents linking Sale in Tenant A to Customer belonging to Tenant B', async () => {
      const custInTenantB = await prisma.customer.create({
        data: makeCustomerData(tenantB, { document: '11144477735' }),
      });

      // Try to create Sale in Tenant A referencing Customer in Tenant B
      await expect(
        prisma.sale.create({
          data: {
            tenantId: tenantA,
            userId: userA,
            customerId: custInTenantB.id,
            status: 'PENDING',
            subtotal: 100,
            discount: 0,
            total: 100,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('1.5 Database Check Constraints & Concurrency', () => {
    it('enforces products_stock_quantity_non_negative CHECK constraint', async () => {
      const product = await prisma.product.create({
        data: {
          tenantId: tenantA,
          name: 'Test Stock Item',
          sku: `SKU-CHK-${Date.now()}`,
          costPrice: 10,
          salePrice: 20,
          margin: 50,
          stockQuantity: 0,
          unit: 'UN',
        },
      });

      // Raw decrement attempt below 0 violates CHECK constraint
      await expect(
        prisma.$executeRaw`
          UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ${product.id}
        `,
      ).rejects.toThrow();
    });

    it('enforces loyalty_accounts_balance_non_negative CHECK constraint', async () => {
      const customer = await prisma.customer.create({
        data: makeCustomerData(tenantA),
      });

      const program = await prisma.loyaltyProgram.create({
        data: {
          tenantId: tenantA,
          name: 'Default Loyalty',
          pointsPerReal: 1,
          redeemRatio: 0.01,
          minRedeemPoints: 10,
          maxDiscountPct: 50,
        },
      });

      const account = await prisma.loyaltyAccount.create({
        data: {
          tenantId: tenantA,
          customerId: customer.id,
          loyaltyProgramId: program.id,
          balance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
        },
      });

      // Attempting to decrement below 0 violates DB CHECK constraint
      await expect(
        prisma.$executeRaw`
          UPDATE loyalty_accounts SET balance = balance - 10 WHERE id = ${account.id}
        `,
      ).rejects.toThrow();
    });

    it('enforces loyalty idempotency: cannot earn points twice for same sale', async () => {
      const customer = await prisma.customer.create({
        data: makeCustomerData(tenantA),
      });

      const program = await prisma.loyaltyProgram.upsert({
        where: { tenantId: tenantA },
        create: {
          tenantId: tenantA,
          name: 'Default Loyalty',
          pointsPerReal: 1,
          redeemRatio: 0.01,
          minRedeemPoints: 10,
          maxDiscountPct: 50,
        },
        update: {},
      });

      const account = await prisma.loyaltyAccount.create({
        data: {
          tenantId: tenantA,
          customerId: customer.id,
          loyaltyProgramId: program.id,
          balance: 100,
          totalEarned: 100,
          totalRedeemed: 0,
        },
      });

      const sale = await prisma.sale.create({
        data: {
          tenantId: tenantA,
          userId: userA,
          customerId: customer.id,
          status: 'COMPLETED',
          subtotal: 50,
          discount: 0,
          total: 50,
        },
      });

      // Insert first transaction
      await prisma.loyaltyTransaction.create({
        data: {
          tenantId: tenantA,
          accountId: account.id,
          saleId: sale.id,
          type: 'EARN',
          points: 50,
          reason: 'First earn',
        },
      });

      // Insert second transaction for same sale and type -> must FAIL unique constraint
      await expect(
        prisma.loyaltyTransaction.create({
          data: {
            tenantId: tenantA,
            accountId: account.id,
            saleId: sale.id,
            type: 'EARN',
            points: 50,
            reason: 'Duplicate earn attempt',
          },
        }),
      ).rejects.toThrow();
    });

    it('handles concurrent race condition: exactly 1 sale succeeds when stock = 1', async () => {
      const product = await prisma.product.create({
        data: {
          tenantId: tenantA,
          name: 'Last Unit Item',
          sku: `SKU-RACE-${Date.now()}`,
          costPrice: 50,
          salePrice: 100,
          margin: 50,
          stockQuantity: 1, // Exactly 1 in stock!
          unit: 'UN',
        },
      });

      // 5 concurrent attempts to decrement the last unit
      const attempts = Array.from({ length: 5 }, async () => {
        try {
          return await prisma.$transaction(async (tx) => {
            const updateResult = await tx.product.updateMany({
              where: {
                id: product.id,
                tenantId: tenantA,
                stockQuantity: { gte: 1 },
              },
              data: {
                stockQuantity: { decrement: 1 },
              },
            });

            if (updateResult.count !== 1) {
              throw new Error('OUT_OF_STOCK');
            }
            return 'SUCCESS';
          });
        } catch {
          return 'FAILED';
        }
      });

      const results = await Promise.all(attempts);
      const successes = results.filter((r) => r === 'SUCCESS').length;
      const failures = results.filter((r) => r === 'FAILED').length;

      expect(successes).toBe(1);
      expect(failures).toBe(4);

      // Verify final stock is 0
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct?.stockQuantity).toBe(0);
    });
  });

  describe('1.6 Return Order & Items Persistence', () => {
    it('successfully persists and updates ReturnOrder with nested ReturnItems and composite tenantId', async () => {
      const customer = await prisma.customer.create({
        data: makeCustomerData(tenantA),
      });

      const product = await prisma.product.create({
        data: {
          tenantId: tenantA,
          name: 'Item to Return',
          sku: `SKU-RET-${Date.now()}`,
          costPrice: 50,
          salePrice: 100,
          margin: 50,
          stockQuantity: 10,
          unit: 'UN',
        },
      });

      const sale = await prisma.sale.create({
        data: {
          tenantId: tenantA,
          userId: userA,
          customerId: customer.id,
          status: 'COMPLETED',
          subtotal: 200,
          discount: 0,
          total: 200,
          items: {
            create: [
              {
                productId: product.id,
                quantity: 2,
                unitPrice: 100,
                discount: 0,
                total: 200,
              },
            ],
          },
        },
        include: { items: true },
      });

      const saleItem = sale.items[0];

      // Save a new return order
      const returnOrderId = uuidv4();
      const returnItemId = uuidv4();

      const repo = new PrismaReturnsRepository(prisma as any);

      const returnOrder = ReturnOrder.create(
        {
          tenantId: tenantA,
          saleId: sale.id,
          userId: userA,
          customerId: customer.id,
          status: 'REQUESTED',
          refundType: 'CASH_REFUND',
          reason: 'Test return',
          totalRefund: 100,
          items: [
            ReturnItem.create(
              {
                productId: product.id,
                saleItemId: saleItem.id,
                quantity: 1,
                unitPrice: 100,
                total: 100,
                condition: 'GOOD',
              },
              new UniqueEntityID(returnItemId),
            ),
          ],
        },
        new UniqueEntityID(returnOrderId),
      );

      // Execute save (creates record via upsert)
      await repo.save(returnOrder);

      // Verify DB persistence
      const saved = await prisma.returnOrder.findUnique({
        where: { id: returnOrderId },
        include: { items: true },
      });

      expect(saved).toBeDefined();
      expect(saved?.tenantId).toBe(tenantA);
      expect(saved?.items.length).toBe(1);
      expect(saved?.items[0].tenantId).toBe(tenantA);
      expect(saved?.items[0].saleItemId).toBe(saleItem.id);

      // Execute save again (updates record via upsert)
      returnOrder.approve(userA);
      await repo.save(returnOrder);

      const updated = await prisma.returnOrder.findUnique({
        where: { id: returnOrderId },
      });
      expect(updated?.status).toBe('APPROVED');
      expect(updated?.approvedBy).toBe(userA);
    });
  });
});
