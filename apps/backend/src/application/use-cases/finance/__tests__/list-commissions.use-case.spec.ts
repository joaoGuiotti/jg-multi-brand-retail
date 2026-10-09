import { ListCommissionsUseCase } from '../list-commissions.use-case';

describe('ListCommissionsUseCase', () => {
  let useCase: ListCommissionsUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      commissionTransaction: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    useCase = new ListCommissionsUseCase(prisma);
  });

  it('should list commissions with pagination and meta', async () => {
    prisma.commissionTransaction.count.mockResolvedValue(1);
    prisma.commissionTransaction.findMany.mockResolvedValue([
      {
        id: 'c1',
        userId: 'u1',
        saleId: 's1',
        baseAmount: 100,
        percentageApplied: 5,
        commissionAmount: 5,
        status: 'PENDING',
        createdAt: new Date('2026-06-01T10:00:00Z'),
        user: { name: 'Seller 1' },
      },
    ]);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].userName).toBe('Seller 1');
    expect(result.data[0].createdAt).toBe(
      new Date('2026-06-01T10:00:00Z').toISOString(),
    );
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('should filter by month and year', async () => {
    prisma.commissionTransaction.count.mockResolvedValue(0);
    prisma.commissionTransaction.findMany.mockResolvedValue([]);

    await useCase.execute({
      tenantId: 'tenant-1',
      month: 6,
      year: 2026,
    });

    expect(prisma.commissionTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date(2026, 5, 1),
            lt: new Date(2026, 6, 1),
          },
        }),
      }),
    );
  });
});
