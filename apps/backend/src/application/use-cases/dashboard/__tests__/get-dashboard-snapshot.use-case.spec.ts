import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardSnapshotUseCase } from '../get-dashboard-snapshot.use-case';

describe('GetDashboardSnapshotUseCase', () => {
  let useCase: GetDashboardSnapshotUseCase;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDashboardSnapshotUseCase,
        {
          provide: PrismaService,
          useValue: {
            sale: { findMany: jest.fn() },
            product: { count: jest.fn() },
            inventoryMovement: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    useCase = module.get<GetDashboardSnapshotUseCase>(
      GetDashboardSnapshotUseCase,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should aggregate KPIs and feeds properly scoped by tenantId', async () => {
      const tenantId = 'tenant-123';

      const mockSales = [
        { id: '1', total: 100, status: 'COMPLETED', createdAt: new Date() },
        { id: '2', total: 200, status: 'COMPLETED', createdAt: new Date() },
      ];

      // Setup detailed mock for all expected prisma calls
      const mockFindManySales = jest
        .fn()
        .mockResolvedValueOnce(mockSales) // First call: completedTodaySales
        .mockResolvedValueOnce([
          // Second call: recentSales
          {
            id: '1',
            total: 100,
            status: 'COMPLETED',
            createdAt: new Date(),
            customerId: 'cust-1',
            items: [{ quantity: 2 }],
          },
        ])
        .mockResolvedValueOnce(mockSales); // Third call: salesLast7Days

      prisma.sale.findMany = mockFindManySales;

      prisma.product.count = jest
        .fn()
        .mockResolvedValueOnce(5) // lowStock
        .mockResolvedValueOnce(2) // outOfStock
        .mockResolvedValueOnce(50); // totalProducts

      prisma.inventoryMovement.findMany = jest.fn().mockResolvedValue([
        {
          id: 'm1',
          productId: 'p1',
          type: 'EXIT',
          quantity: 1,
          createdAt: new Date(),
          product: { name: 'Prod1' },
        },
      ]);

      const result = await useCase.execute({ tenantId });

      expect(result).toBeDefined();
      expect(result.kpis.revenueToday).toBe(300);
      expect(result.kpis.salesToday).toBe(2);
      expect(result.kpis.lowStock).toBe(5);
      expect(result.kpis.outOfStock).toBe(2);
      expect(result.kpis.totalProducts).toBe(50);

      expect(result.recentSales.length).toBe(1);
      expect(result.recentSales[0].itemCount).toBe(2);

      expect(result.recentMovements.length).toBe(1);

      // Verify tenant scoping was passed to prisma
      expect(mockFindManySales.mock.calls[0][0].where.tenantId).toBe(tenantId);
    });
  });
});
