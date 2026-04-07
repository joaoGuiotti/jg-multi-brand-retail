import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Product } from '../../../../domain/entities/products/product.entity';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { CreateSaleUseCase } from '../create-sale.use-case';

const makeProduct = (overrides: any = {}) =>
  Product.create({
    name: 'Widget',
    sku: 'WG-001',
    costPrice: 10,
    salePrice: 20,
    margin: 100,
    stockQuantity: 20,
    unit: 'UN',
    active: true,
    ...overrides,
  });

const makeSale = (overrides: any = {}) =>
  Sale.create({
    userId: 'user-1',
    subtotal: 40,
    discount: 0,
    total: 40,
    status: 'PENDING',
    items: [
      SaleItem.create({
        productId: 'p1',
        quantity: 2,
        unitPrice: 20,
        discount: 0,
        total: 40,
      }),
    ],
    ...overrides,
  });

describe('CreateSaleUseCase', () => {
  let useCase: CreateSaleUseCase;
  let saleRepository: any;
  let productRepository: any;
  let prisma: any;

  beforeEach(() => {
    saleRepository = { create: jest.fn() };
    productRepository = { findById: jest.fn(), update: jest.fn() };
    prisma = {};
    useCase = new CreateSaleUseCase(saleRepository, productRepository, prisma);
  });

  const baseInput = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    items: [{ productId: 'p1', quantity: 2, unitPrice: 20 }],
  };

  it('should throw NotFoundException if product not found', async () => {
    productRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if product is inactive', async () => {
    productRepository.findById.mockResolvedValue(
      makeProduct({ active: false }),
    );
    await expect(useCase.execute(baseInput)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if stock is insufficient', async () => {
    productRepository.findById.mockResolvedValue(
      makeProduct({ stockQuantity: 1 }),
    );
    await expect(
      useCase.execute({
        ...baseInput,
        items: [{ productId: 'p1', quantity: 5, unitPrice: 20 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create a sale with customerId and return output', async () => {
    const product = makeProduct();
    const sale = makeSale({ customerId: 'cust-1' });
    productRepository.findById.mockResolvedValue(product);
    saleRepository.create.mockResolvedValue(sale);
    prisma.customer = {
      findFirst: jest.fn().mockResolvedValue({ id: 'cust-1' }),
    };

    const result = await useCase.execute({
      ...baseInput,
      customerId: 'cust-1',
    });
    expect(result).toBeDefined();
    expect(result.customerId).toBe('cust-1');
    expect(prisma.customer.findFirst).toHaveBeenCalledWith({
      where: { id: 'cust-1', tenantId: 'tenant-1' },
    });
  });

  it('should throw NotFoundException if customer not found', async () => {
    productRepository.findById.mockResolvedValue(makeProduct());
    prisma.customer = { findFirst: jest.fn().mockResolvedValue(null) };

    await expect(
      useCase.execute({ ...baseInput, customerId: 'non-existent' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should apply sale-level discount', async () => {
    const product = makeProduct();
    const sale = makeSale();
    productRepository.findById.mockResolvedValue(product);
    saleRepository.create.mockResolvedValue(sale);

    const saleArg: any = await useCase.execute({ ...baseInput, discount: 5 });
    expect(saleRepository.create).toHaveBeenCalled();
    const createdSale = saleRepository.create.mock.calls[0][1];
    expect(createdSale.discount).toBe(5);
  });

  it('should apply per-item discount', async () => {
    const product = makeProduct();
    const sale = makeSale();
    productRepository.findById.mockResolvedValue(product);
    saleRepository.create.mockResolvedValue(sale);

    await useCase.execute({
      ...baseInput,
      items: [{ productId: 'p1', quantity: 2, unitPrice: 20, discount: 5 }],
    });
    const createdSale = saleRepository.create.mock.calls[0][1];
    expect(createdSale.subtotal).toBe(35); // (20*2)-5
  });
});
