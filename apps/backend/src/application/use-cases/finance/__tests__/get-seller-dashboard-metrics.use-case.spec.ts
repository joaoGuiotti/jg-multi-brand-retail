import { GetSellerDashboardMetricsUseCase } from '../get-seller-dashboard-metrics.use-case';

describe('GetSellerDashboardMetricsUseCase', () => {
  let useCase: GetSellerDashboardMetricsUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      salesTarget: { findUnique: jest.fn() },
      commissionTransaction: { aggregate: jest.fn() },
      sale: { aggregate: jest.fn() },
    };
    useCase = new GetSellerDashboardMetricsUseCase(prisma);
  });

  it('should return metrics for the seller', async () => {
    prisma.salesTarget.findUnique.mockResolvedValue({ targetAmount: 10000 });
    prisma.commissionTransaction.aggregate.mockResolvedValue({ _sum: { commissionAmount: 500, baseAmount: 5000 } });
    prisma.sale.aggregate.mockResolvedValue({ _sum: { total: 5000 } });

    const result = await useCase.execute({ tenantId: 'tenant-1', userId: 'user-1', month: 6, year: 2026 });

    expect(result.targetAmount).toBe(10000);
    expect(result.totalSold).toBe(5000);
    expect(result.commissionEarned).toBe(500);
    expect(result.progressPercentage).toBe(50);
  });

  it('should return 0 metrics if no target and no sales', async () => {
    prisma.salesTarget.findUnique.mockResolvedValue(null);
    prisma.commissionTransaction.aggregate.mockResolvedValue({ _sum: { commissionAmount: null, baseAmount: null } });
    prisma.sale.aggregate.mockResolvedValue({ _sum: { total: null } });

    const result = await useCase.execute({ tenantId: 'tenant-1', userId: 'user-1', month: 6, year: 2026 });

    expect(result.targetAmount).toBe(0);
    expect(result.totalSold).toBe(0);
    expect(result.commissionEarned).toBe(0);
    expect(result.progressPercentage).toBe(0);
  });

  it('should calculate progress percentage over 100 if exceeded', async () => {
    prisma.salesTarget.findUnique.mockResolvedValue({ targetAmount: 1000 });
    prisma.commissionTransaction.aggregate.mockResolvedValue({ _sum: { commissionAmount: 200, baseAmount: 2000 } });
    prisma.sale.aggregate.mockResolvedValue({ _sum: { total: 2000 } });

    const result = await useCase.execute({ tenantId: 'tenant-1', userId: 'user-1', month: 6, year: 2026 });

    expect(result.progressPercentage).toBe(200);
  });
});
