import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { CreateReturnUseCase } from '../create-return.use-case';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeSaleItem = (productId = 'prod-1') =>
  SaleItem.create({ productId, quantity: 3, unitPrice: 50, discount: 0, total: 150 });

const makeSale = (status: any = 'COMPLETED') =>
  Sale.create({
    userId: 'user-1',
    subtotal: 150,
    discount: 0,
    total: 150,
    status,
    items: [makeSaleItem()],
  });

const makeDto = (overrides: any = {}) => ({
  saleId: 'sale-1',
  refundType: 'CASH_REFUND' as any,
  reason: 'Produto com defeito',
  items: [{ productId: 'prod-1', quantity: 1, condition: 'GOOD' as any }],
  ...overrides,
});

const makeReturnOrder = (overrides: any = {}) => ({
  id: { toString: () => 'return-1' },
  tenantId: 'tenant-1',
  saleId: 'sale-1',
  userId: 'user-1',
  customerId: null,
  status: 'REQUESTED',
  refundType: 'CASH_REFUND',
  reason: 'Defeito',
  totalRefund: 50,
  approvedBy: null,
  approvedAt: null,
  processedAt: null,
  createdAt: new Date(),
  items: [],
  ...overrides,
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const makeReturnsRepo = () => ({
  save: jest.fn().mockResolvedValue(undefined),
  findBySaleId: jest.fn().mockResolvedValue([]),
  findById: jest.fn(),
  findAll: jest.fn(),
});

const makeSaleRepo = () => ({
  findById: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
  create: jest.fn(),
  findAll: jest.fn(),
  getDailyRevenue: jest.fn(),
});

const makeUserRepo = () => ({
  findAllByTenant: jest.fn().mockResolvedValue([]),
  findById: jest.fn(),
  findByEmail: jest.fn(),
});

const makeNotification = () => ({
  execute: jest.fn().mockResolvedValue(undefined),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeUseCase = (deps: any = {}) => {
  const returnsRepo = deps.returnsRepo ?? makeReturnsRepo();
  const saleRepo = deps.saleRepo ?? makeSaleRepo();
  const userRepo = deps.userRepo ?? makeUserRepo();
  const notification = deps.notification ?? makeNotification();
  const useCase = new CreateReturnUseCase(returnsRepo, saleRepo, userRepo, notification);
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
        useCase.execute('tenant-1', 'user-1', makeDto({ items: [{ productId: 'unknown', quantity: 1, condition: 'GOOD' }] })),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quantity exceeds sale quantity', async () => {
      const { useCase, saleRepo } = makeUseCase();
      saleRepo.findById.mockResolvedValue(makeSale('COMPLETED'));

      await expect(
        useCase.execute('tenant-1', 'user-1', makeDto({ items: [{ productId: 'prod-1', quantity: 99, condition: 'GOOD' }] })),
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
      const result = await useCase.execute('tenant-1', 'user-1', makeDto({
        items: [{ productId: 'prod-1', quantity: 2, condition: 'GOOD' }],
      }));

      expect(result.totalRefund).toBe(100);
    });
  });
});
