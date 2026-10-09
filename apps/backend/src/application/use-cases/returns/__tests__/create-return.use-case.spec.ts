import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { CreateReturnUseCase } from '../create-return.use-case';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeSaleItem = (productId = 'prod-1') =>
  SaleItem.create({
    productId,
    quantity: 3,
    unitPrice: 50,
    discount: 0,
    total: 150,
  });

const makeSale = (status: any = 'COMPLETED') =>
  Sale.create({
    userId: 'user-1',
    subtotal: 150,
    discount: 0,
    total: 150,
    status,
    items: [makeSaleItem()],
  });

const makeDto = (overrides: any = {}): any => ({
  saleId: 'sale-1',
  refundType: 'CASH_REFUND' as any,
  reason: 'Produto com defeito',
  items: [{ productId: 'prod-1', quantity: 1, condition: 'GOOD' as any }],
  ...overrides,
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const makeReturnsRepo = () =>
  ({
    save: jest.fn().mockResolvedValue(undefined),
    findBySaleId: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findAll: jest.fn(),
  }) as any;

const makeSaleRepo = () =>
  ({
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    findAll: jest.fn(),
    getDailyRevenue: jest.fn(),
  }) as any;

const makeUserRepo = () =>
  ({
    findAllByTenant: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByEmail: jest.fn(),
  }) as any;

const makeNotification = () =>
  ({
    execute: jest.fn().mockResolvedValue(undefined),
  }) as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeUseCase = (deps: any = {}) => {
  const returnsRepo = deps.returnsRepo ?? makeReturnsRepo();
  const saleRepo = deps.saleRepo ?? makeSaleRepo();
  const userRepo = deps.userRepo ?? makeUserRepo();
  const notification = deps.notification ?? makeNotification();
  const useCase = new CreateReturnUseCase(
    returnsRepo,
    saleRepo,
    userRepo,
    notification,
  );
  return { useCase, returnsRepo, saleRepo, userRepo, notification };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateReturnUseCase', () => {
  describe('validation', () => {
    it('should throw NotFoundException when sale does not exist', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('tenant-1', 'user-1', makeDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when sale is PENDING', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(makeSale('PENDING'));

      await expect(
        useCase.execute('tenant-1', 'user-1', makeDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when sale is already RETURN_REQUESTED', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(makeSale('RETURN_REQUESTED'));

      await expect(
        useCase.execute('tenant-1', 'user-1', makeDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when sale is RETURNED', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(makeSale('RETURNED'));

      await expect(
        useCase.execute('tenant-1', 'user-1', makeDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when sale is CANCELLED', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(makeSale('CANCELLED'));

      await expect(
        useCase.execute('tenant-1', 'user-1', makeDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when product is not in the sale', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(makeSale('COMPLETED'));

      await expect(
        useCase.execute(
          'tenant-1',
          'user-1',
          makeDto({
            items: [{ productId: 'unknown', quantity: 1, condition: 'GOOD' }],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quantity exceeds sale quantity', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(makeSale('COMPLETED'));

      await expect(
        useCase.execute(
          'tenant-1',
          'user-1',
          makeDto({
            items: [{ productId: 'prod-1', quantity: 99, condition: 'GOOD' }],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('happy path', () => {
    it('should create a ReturnOrder and transition sale to RETURN_REQUESTED', async () => {
      const sale = makeSale('COMPLETED');
      const { useCase, saleRepo, returnsRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(sale);

      const result = await useCase.execute('tenant-1', 'user-1', makeDto());

      // ReturnOrder saved
      expect(returnsRepo.save).toHaveBeenCalledTimes(1);
      // Sale updated after requestReturn()
      expect(saleRepo.update).toHaveBeenCalledTimes(1);
      const updatedSale: Sale = saleRepo.update.mock.calls[0][1];
      expect(updatedSale.status).toBe('RETURN_REQUESTED');
      // Output is correct
      expect(result.status).toBe('REQUESTED');
    });

    it('should notify admins with RETURN_PENDING type', async () => {
      const sale = makeSale('COMPLETED');
      const admin = { id: { toString: () => 'admin-1' }, role: 'ADMIN' };
      const { useCase, saleRepo, userRepo, notification } = makeUseCase();
      saleRepo.findById.mockResolvedValue(sale);
      userRepo.findAllByTenant.mockResolvedValue([admin]);

      await useCase.execute('tenant-1', 'user-1', makeDto());

      expect(notification.execute).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ userId: 'admin-1' }),
      );
    });

    it('should correctly compute totalRefund from item quantity and unitPrice', async () => {
      const sale = makeSale('COMPLETED');
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(sale);

      // 2 units × R$50 = R$100
      const result = await useCase.execute(
        'tenant-1',
        'user-1',
        makeDto({
          items: [{ productId: 'prod-1', quantity: 2, condition: 'GOOD' }],
        }),
      );

      expect(result.totalRefund).toBe(100);
    });

    it('should link saleItemId to return item', async () => {
      const sale = makeSale('COMPLETED');
      const { useCase, saleRepo, returnsRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(sale);

      await useCase.execute(
        'tenant-1',
        'user-1',
        makeDto({
          items: [{ productId: 'prod-1', quantity: 1, condition: 'GOOD' }],
        }),
      );

      expect(returnsRepo.save).toHaveBeenCalledTimes(1);
      const savedOrder = returnsRepo.save.mock.calls[0][0];
      expect(savedOrder.items[0].saleItemId).toBe(sale.items[0].id.toString());
    });

    it('should reject return if accumulated quantity across previous returns exceeds sold quantity', async () => {
      const sale = makeSale('COMPLETED'); // quantity sold is 3
      const { useCase, saleRepo, returnsRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(sale);

      // Existing active return order has already returned 2 units
      const existingReturn = {
        status: 'REQUESTED',
        items: [
          {
            productId: 'prod-1',
            saleItemId: sale.items[0].id.toString(),
            quantity: 2,
          },
        ],
      };
      returnsRepo.findBySaleId.mockResolvedValue([existingReturn]);

      // Requesting 2 more units (2 + 2 = 4 > 3 sold) must fail
      await expect(
        useCase.execute(
          'tenant-1',
          'user-1',
          makeDto({
            items: [{ productId: 'prod-1', quantity: 2, condition: 'GOOD' }],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow partial return if accumulated quantity does not exceed sold quantity', async () => {
      const sale = makeSale('COMPLETED'); // quantity sold is 3
      const { useCase, saleRepo, returnsRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(sale);

      // Existing active return order returned 1 unit
      const existingReturn = {
        status: 'APPROVED',
        items: [
          {
            productId: 'prod-1',
            saleItemId: sale.items[0].id.toString(),
            quantity: 1,
          },
        ],
      };
      returnsRepo.findBySaleId.mockResolvedValue([existingReturn]);

      // Requesting 2 more units (1 + 2 = 3 <= 3 sold) must succeed
      const result = await useCase.execute(
        'tenant-1',
        'user-1',
        makeDto({
          items: [{ productId: 'prod-1', quantity: 2, condition: 'GOOD' }],
        }),
      );

      expect(result.status).toBe('REQUESTED');
      expect(returnsRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
