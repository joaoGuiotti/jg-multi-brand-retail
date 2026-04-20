import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { ReturnOrder } from '../../../../domain/entities/returns/return-order.entity';
import { ProcessRefundUseCase } from '../process-refund.use-case';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeSale = (status: any = 'RETURN_REQUESTED') =>
  Sale.create({
    userId: 'user-1',
    subtotal: 100,
    discount: 0,
    total: 100,
    status,
    items: [
      SaleItem.create({
        productId: 'p1',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        total: 100,
      }),
    ],
  });

const makeReturnOrder = (status: any = 'APPROVED') => {
  const order = ReturnOrder.create({
    tenantId: 'tenant-1',
    saleId: 'sale-1',
    userId: 'user-1',
    status: 'REQUESTED',
    refundType: 'CASH_REFUND',
    reason: 'Defeito',
    totalRefund: 100,
    items: [],
  });

  // Advance to desired status using domain methods
  if (status === 'APPROVED' || status === 'REFUNDED') {
    order.approve('admin-1');
  }
  if (status === 'REFUNDED') {
    order.processRefund();
  }

  return order;
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

const makeReturnsRepo = (order: any) => ({
  findById: jest.fn().mockResolvedValue(order),
  save: jest.fn().mockResolvedValue(undefined),
  findAll: jest.fn().mockResolvedValue([]),
  findBySaleId: jest.fn().mockResolvedValue([]),
});

const makeSaleRepo = (sale: any = null) => ({
  findById: jest.fn().mockResolvedValue(sale),
  update: jest.fn().mockResolvedValue(undefined),
  create: jest.fn().mockResolvedValue(undefined),
  findAll: jest.fn().mockResolvedValue([]),
  getDailyRevenue: jest.fn().mockResolvedValue([]),
});

const makeNotification = () => ({
  execute: jest.fn().mockResolvedValue(undefined),
});

const makeUseCase = (order: any, sale: any = null) => {
  const returnsRepo = makeReturnsRepo(order);
  const saleRepo = makeSaleRepo(sale);
  const notification = makeNotification();
  const useCase = new ProcessRefundUseCase(returnsRepo, saleRepo, notification as any);
  return { useCase, returnsRepo, saleRepo, notification };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProcessRefundUseCase', () => {
  describe('validation', () => {
    it('should throw NotFoundException when return order not found', async () => {
      const { useCase, returnsRepo } = makeUseCase(null);
      returnsRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute('tenant-1', 'return-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when order is REQUESTED (not yet approved)', async () => {
      const order = makeReturnOrder('REQUESTED');
      const { useCase } = makeUseCase(order);

      await expect(useCase.execute('tenant-1', 'return-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when order is already REFUNDED', async () => {
      const order = makeReturnOrder('REFUNDED');
      const { useCase } = makeUseCase(order);

      await expect(useCase.execute('tenant-1', 'return-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when order is REJECTED', async () => {
      const rejected = ReturnOrder.create({
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        userId: 'user-1',
        status: 'REQUESTED',
        refundType: 'CASH_REFUND',
        reason: null,
        totalRefund: 0,
        items: [],
      });
      rejected.reject('admin-1');

      const { useCase } = makeUseCase(rejected);
      await expect(useCase.execute('tenant-1', 'return-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('happy path', () => {
    it('should transition ReturnOrder to REFUNDED and Sale to RETURNED', async () => {
      const order = makeReturnOrder('APPROVED');
      const sale = makeSale('RETURN_REQUESTED');
      const { useCase, returnsRepo, saleRepo } = makeUseCase(order, sale);

      const result = await useCase.execute('tenant-1', 'return-1');

      // ReturnOrder transitioned
      expect(result.status).toBe('REFUNDED');
      expect(returnsRepo.save).toHaveBeenCalledTimes(1);
      // Sale transitioned to RETURNED
      expect(saleRepo.update).toHaveBeenCalledTimes(1);
      const updatedSale: Sale = saleRepo.update.mock.calls[0][1];
      expect(updatedSale.status).toBe('RETURNED');
    });

    it('should not fail if sale is not found (defensive)', async () => {
      const order = makeReturnOrder('APPROVED');
      const { useCase, saleRepo } = makeUseCase(order, null);

      await expect(
        useCase.execute('tenant-1', 'return-1'),
      ).resolves.toBeDefined();
      expect(saleRepo.update).not.toHaveBeenCalled();
    });

    it('should notify the requesting user with RETURN_REFUNDED', async () => {
      const order = makeReturnOrder('APPROVED');
      const { useCase, notification } = makeUseCase(order);

      await useCase.execute('tenant-1', 'return-1');

      expect(notification.execute).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('should set processedAt on the return order', async () => {
      const order = makeReturnOrder('APPROVED');
      const { useCase } = makeUseCase(order);

      const result = await useCase.execute('tenant-1', 'return-1');

      expect(result.processedAt).toBeDefined();
      expect(result.processedAt).not.toBeNull();
    });
  });
});
