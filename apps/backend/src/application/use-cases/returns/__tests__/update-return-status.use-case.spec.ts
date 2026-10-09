import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { ReturnOrder } from '../../../../domain/entities/returns/return-order.entity';
import { UpdateReturnStatusUseCase } from '../update-return-status.use-case';

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

const makeReturnOrder = (status: any = 'REQUESTED') =>
  ReturnOrder.create({
    tenantId: 'tenant-1',
    saleId: 'sale-1',
    userId: 'user-1',
    status,
    refundType: 'CASH_REFUND',
    reason: 'Defeito',
    totalRefund: 100,
    items: [],
  });

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
  const useCase = new UpdateReturnStatusUseCase(
    returnsRepo,
    saleRepo,
    notification as any,
  );
  return { useCase, returnsRepo, saleRepo, notification };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UpdateReturnStatusUseCase', () => {
  describe('validation', () => {
    it('should throw NotFoundException when return order not found', async () => {
      const { useCase, returnsRepo } = makeUseCase(null);
      returnsRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('tenant-1', 'admin-1', 'return-1', {
          status: 'APPROVED' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is not REQUESTED', async () => {
      const order = makeReturnOrder('APPROVED');
      const { useCase } = makeUseCase(order);

      await expect(
        useCase.execute('tenant-1', 'admin-1', 'return-1', {
          status: 'REJECTED' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to set REFUNDED directly', async () => {
      const order = makeReturnOrder('REQUESTED');
      const { useCase } = makeUseCase(order);

      await expect(
        useCase.execute('tenant-1', 'admin-1', 'return-1', {
          status: 'REFUNDED' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve flow', () => {
    it('should approve the return order without changing sale status', async () => {
      const order = makeReturnOrder('REQUESTED');
      const sale = makeSale('RETURN_REQUESTED');
      const { useCase, returnsRepo, saleRepo } = makeUseCase(order, sale);

      const result = await useCase.execute('tenant-1', 'admin-1', 'return-1', {
        status: 'APPROVED',
      });

      expect(result.status).toBe('APPROVED');
      expect(returnsRepo.save).toHaveBeenCalledTimes(1);
      // Sale should NOT be updated on approve — it stays RETURN_REQUESTED
      expect(saleRepo.update).not.toHaveBeenCalled();
    });

    it('should notify the requesting user with RETURN_APPROVED', async () => {
      const order = makeReturnOrder('REQUESTED');
      const { useCase, notification } = makeUseCase(order);

      await useCase.execute('tenant-1', 'admin-1', 'return-1', {
        status: 'APPROVED',
      });

      expect(notification.execute).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });

  describe('reject flow', () => {
    it('should reject the return order and transition sale back to COMPLETED', async () => {
      const order = makeReturnOrder('REQUESTED');
      const sale = makeSale('RETURN_REQUESTED');
      const { useCase, saleRepo } = makeUseCase(order, sale);

      const result = await useCase.execute('tenant-1', 'admin-1', 'return-1', {
        status: 'REJECTED',
        reason: 'Fora do prazo',
      });

      expect(result.status).toBe('REJECTED');
      // Sale should be updated back to COMPLETED
      expect(saleRepo.update).toHaveBeenCalledTimes(1);
      const updatedSale: Sale = saleRepo.update.mock.calls[0][1];
      expect(updatedSale.status).toBe('COMPLETED');
    });

    it('should not fail if sale is not found on reject (defensive)', async () => {
      const order = makeReturnOrder('REQUESTED');
      const { useCase, saleRepo } = makeUseCase(order, null);

      await expect(
        useCase.execute('tenant-1', 'admin-1', 'return-1', {
          status: 'REJECTED' as any,
        }),
      ).resolves.toBeDefined();

      expect(saleRepo.update).not.toHaveBeenCalled();
    });

    it('should notify the requesting user with RETURN_REJECTED', async () => {
      const order = makeReturnOrder('REQUESTED');
      const { useCase, notification } = makeUseCase(order);

      await useCase.execute('tenant-1', 'admin-1', 'return-1', {
        status: 'REJECTED',
        reason: 'Fora do prazo',
      });

      expect(notification.execute).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });
});
