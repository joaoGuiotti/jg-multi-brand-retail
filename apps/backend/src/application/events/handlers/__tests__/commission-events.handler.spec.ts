import { CommissionEventsHandler } from '../commission-events.handler';

describe('CommissionEventsHandler', () => {
  let handler: CommissionEventsHandler;
  let getCommissionRateUseCase: any;
  let prisma: any;
  let logger: any;

  beforeEach(() => {
    prisma = {
      tenant: { findUnique: jest.fn() },
      sale: { findUnique: jest.fn() },
      commissionTransaction: { create: jest.fn() },
    };
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    handler = new CommissionEventsHandler(prisma);
    (handler as any).logger = logger;
  });

  it('should calculate and save commission on sale.completed', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      commissionRate: 10,
    });
    prisma.commissionTransaction.create.mockResolvedValue({});

    await handler.handleSaleCompletedEvent({ sale: { id: 'sale-1', userId: 'user-1', total: 100 }, tenantId: 'tenant-1' } as any);

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { id: 'tenant-1' }, select: { commissionRate: true } });
    expect(prisma.commissionTransaction.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        userId: 'user-1',
        baseAmount: 100,
        percentageApplied: 10,
        commissionAmount: 10,
        status: 'PENDING',
      },
    });
  });

  it('should skip commission if rate is 0 or null', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      commissionRate: 0,
    });

    await handler.handleSaleCompletedEvent({ sale: { id: 'sale-1', userId: 'user-1', total: 100 }, tenantId: 'tenant-1' } as any);

    expect(prisma.commissionTransaction.create).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('no commission rate configured'));
  });

  it('should skip commission if tenant is not found', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    await handler.handleSaleCompletedEvent({ sale: { id: 'sale-1', userId: 'user-1', total: 100 }, tenantId: 'tenant-1' } as any);

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { id: 'tenant-1' }, select: { commissionRate: true } });
    expect(prisma.commissionTransaction.create).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('no commission rate configured'));
  });
});
