import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { CompleteSaleUseCase } from '../complete-sale.use-case';

const makeItem = () =>
  SaleItem.create({
    productId: 'p1',
    quantity: 2,
    unitPrice: 20,
    discount: 0,
    total: 40,
  });

const makeSale = (overrides: any = {}) =>
  Sale.create({
    userId: 'user-1',
    subtotal: 40,
    discount: 0,
    total: 40,
    status: 'PENDING',
    items: [makeItem()],
    ...overrides,
  });

describe('CompleteSaleUseCase', () => {
  let useCase: CompleteSaleUseCase;
  let saleRepository: any;
  let prisma: any;

  beforeEach(() => {
    saleRepository = { findById: jest.fn(), update: jest.fn() };
    prisma = { payment: { findMany: jest.fn() } };
    useCase = new CompleteSaleUseCase(saleRepository, prisma);
  });

  it('should throw NotFoundException if sale not found', async () => {
    saleRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute({ tenantId: 't', id: 's' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if sale cannot be completed', async () => {
    saleRepository.findById.mockResolvedValue(
      makeSale({ status: 'COMPLETED' }),
    );
    prisma.payment.findMany.mockResolvedValue([{ amount: '40' }]);
    await expect(useCase.execute({ tenantId: 't', id: 's' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if total paid is insufficient', async () => {
    const sale = makeSale({ total: 100 });
    saleRepository.findById.mockResolvedValue(sale);
    prisma.payment.findMany.mockResolvedValue([{ amount: '30' }]);
    await expect(useCase.execute({ tenantId: 't', id: 's' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should complete the sale when fully paid', async () => {
    const sale = makeSale({ total: 40 });
    const completed = makeSale({ status: 'COMPLETED' });
    saleRepository.findById.mockResolvedValue(sale);
    saleRepository.update.mockResolvedValue(completed);
    prisma.payment.findMany.mockResolvedValue([{ amount: '40' }]);

    const result = await useCase.execute({ tenantId: 'tenant-1', id: 's1' });
    expect(result.status).toBe('COMPLETED');
  });
});
