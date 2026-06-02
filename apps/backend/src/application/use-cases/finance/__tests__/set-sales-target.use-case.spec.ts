import { SetSalesTargetUseCase } from '../set-sales-target.use-case';

describe('SetSalesTargetUseCase', () => {
  let useCase: SetSalesTargetUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      salesTarget: {
        upsert: jest.fn(),
      },
    };
    useCase = new SetSalesTargetUseCase(prisma);
  });

  it('should set the sales target for the user', async () => {
    prisma.salesTarget.upsert.mockResolvedValue({
      id: 'target-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      month: 6,
      year: 2026,
      targetAmount: 10000,
    });
    
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      month: 6,
      year: 2026,
      targetAmount: 10000,
    });
    
    expect(prisma.salesTarget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_userId_month_year: { tenantId: 'tenant-1', userId: 'user-1', month: 6, year: 2026 } }
      })
    );
    expect(result.targetAmount).toEqual(10000);
  });
});
