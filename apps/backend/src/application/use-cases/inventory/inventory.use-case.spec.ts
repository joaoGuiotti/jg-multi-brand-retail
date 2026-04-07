import { NotFoundException } from '@nestjs/common';
import {
  InventoryMovementType,
  InventoryMovementTypes,
} from '../../../domain/entities/inventory/inventory-movement-type.vo';
import { InventoryMovement } from '../../../domain/entities/inventory/inventory-movement.entity';
import { Product } from '../../../domain/entities/products/product.entity';
import { GetProductMovementsUseCase } from './get-product-movements.use-case';
import { GetStockSummaryUseCase } from './get-stock-summary.use-case';
import { ListMovementsUseCase } from './list-movements.use-case';

const makeMovement = () =>
  InventoryMovement.create({
    productId: 'p1',
    userId: 'u1',
    type: InventoryMovementType.create(InventoryMovementTypes.ENTRY),
    quantity: 5,
  });

const makeProduct = () =>
  Product.create({
    name: 'Widget',
    sku: 'WG-001',
    costPrice: 10,
    salePrice: 20,
    margin: 100,
    stockQuantity: 10,
    unit: 'UN',
    active: true,
  });

describe('ListMovementsUseCase', () => {
  let useCase: ListMovementsUseCase;
  let inventoryRepository: any;

  beforeEach(() => {
    inventoryRepository = { findAll: jest.fn() };
    useCase = new ListMovementsUseCase(inventoryRepository);
  });

  it('should return paginated movements', async () => {
    inventoryRepository.findAll.mockResolvedValue({
      data: [makeMovement()],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should return empty list when no movements', async () => {
    inventoryRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
    const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
    expect(result.data).toHaveLength(0);
  });
});

describe('GetProductMovementsUseCase', () => {
  let useCase: GetProductMovementsUseCase;
  let inventoryRepository: any;
  let productRepository: any;

  beforeEach(() => {
    inventoryRepository = { findAll: jest.fn() };
    productRepository = { findById: jest.fn() };
    useCase = new GetProductMovementsUseCase(
      inventoryRepository,
      productRepository,
    );
  });

  it('should throw NotFoundException if product not found', async () => {
    productRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ tenantId: 't', productId: 'p' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return product and its movements', async () => {
    const product = makeProduct();
    const movement = makeMovement();
    productRepository.findById.mockResolvedValue(product);
    inventoryRepository.findAll.mockResolvedValue({
      data: [movement],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    });

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      productId: 'p1',
    });
    expect(result.product.sku).toBe('WG-001');
    expect(result.movements).toHaveLength(1);
  });
});

describe('GetStockSummaryUseCase', () => {
  let useCase: GetStockSummaryUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      product: { count: jest.fn() },
      inventoryMovement: { groupBy: jest.fn() },
    };
    useCase = new GetStockSummaryUseCase(prisma);
  });

  it('should return stock summary with movement breakdown', async () => {
    prisma.product.count
      .mockResolvedValueOnce(3) // lowStock
      .mockResolvedValueOnce(1) // outOfStock
      .mockResolvedValueOnce(20); // total
    prisma.inventoryMovement.groupBy.mockResolvedValue([
      { type: InventoryMovementTypes.ENTRY, _count: { type: 5 } },
      { type: InventoryMovementTypes.EXIT, _count: { type: 2 } },
    ]);

    const result = await useCase.execute({ tenantId: 'tenant-1' });
    expect(result.stock.total).toBe(20);
    expect(result.stock.lowStock).toBe(3);
    expect(result.stock.outOfStock).toBe(1);
    expect(result.recentMovements['ENTRY']).toBe(5);
    expect(result.recentMovements['EXIT']).toBe(2);
  });

  it('should handle empty movements', async () => {
    prisma.product.count.mockResolvedValue(0);
    prisma.inventoryMovement.groupBy.mockResolvedValue([]);

    const result = await useCase.execute({ tenantId: 'tenant-1' });
    expect(result.stock.total).toBe(0);
    expect(result.recentMovements).toEqual({});
  });
});
