import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Product } from '../../../../domain/entities/products/product.entity';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { CancelSaleUseCase } from '../cancel-sale.use-case';

const makeItem = (overrides: any = {}) =>
  SaleItem.create({
    productId: 'p1',
    quantity: 2,
    unitPrice: 10,
    discount: 0,
    total: 20,
    ...overrides,
  });

const makeSale = (overrides: any = {}) =>
  Sale.create({
    userId: 'user-1',
    subtotal: 20,
    discount: 0,
    total: 20,
    status: 'PENDING',
    items: [makeItem()],
    ...overrides,
  });

const makeProduct = (overrides: any = {}) =>
  Product.create({
    name: 'Widget',
    sku: 'WG-001',
    costPrice: 10,
    salePrice: 20,
    margin: 100,
    stockQuantity: 5,
    unit: 'UN',
    active: true,
    ...overrides,
  });

describe('CancelSaleUseCase', () => {
  let useCase: CancelSaleUseCase;
  let saleRepository: any;
  let productRepository: any;
  let eventPublisher: any;

  beforeEach(() => {
    saleRepository = { findById: jest.fn(), update: jest.fn() };
    productRepository = { findById: jest.fn(), update: jest.fn() };
    eventPublisher = { publishEvents: jest.fn() };
    useCase = new CancelSaleUseCase(saleRepository, productRepository, eventPublisher);
  });

  it('should throw NotFoundException if sale not found', async () => {
    saleRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute({ tenantId: 't', id: 's' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if sale cannot be cancelled', async () => {
    saleRepository.findById.mockResolvedValue(
      makeSale({ status: 'CANCELLED' }),
    );
    await expect(useCase.execute({ tenantId: 't', id: 's' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should cancel the sale and restore stock', async () => {
    const sale = makeSale();
    const product = makeProduct({ stockQuantity: 5 });
    const cancelled = makeSale({ status: 'CANCELLED' });
    saleRepository.findById.mockResolvedValue(sale);
    saleRepository.update.mockResolvedValue(cancelled);
    productRepository.findById.mockResolvedValue(product);

    const result = await useCase.execute({ tenantId: 'tenant-1', id: 's1' });
    expect(result.status).toBe('CANCELLED');
    expect(product.stockQuantity).toBe(7); // 5 + 2 restored
  });

  it('should still complete if product not found during stock restore', async () => {
    const sale = makeSale();
    const cancelled = makeSale({ status: 'CANCELLED' });
    saleRepository.findById.mockResolvedValue(sale);
    saleRepository.update.mockResolvedValue(cancelled);
    productRepository.findById.mockResolvedValue(null); // product not found

    const result = await useCase.execute({ tenantId: 't', id: 's1' });
    expect(result.status).toBe('CANCELLED');
    expect(productRepository.update).not.toHaveBeenCalled();
  });
});
