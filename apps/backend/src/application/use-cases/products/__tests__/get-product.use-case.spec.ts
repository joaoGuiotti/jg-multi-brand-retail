import { NotFoundException } from '@nestjs/common';
import { Product } from '../../../../domain/entities/products/product.entity';
import { GetProductUseCase } from '../get-product.use-case';

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

describe('GetProductUseCase', () => {
  let useCase: GetProductUseCase;
  let productRepository: any;

  beforeEach(() => {
    productRepository = {
      findById: jest.fn(),
      findBySku: jest.fn(),
      findByBarcode: jest.fn(),
    };
    useCase = new GetProductUseCase(productRepository);
  });

  describe('execute()', () => {
    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(
        useCase.execute({ tenantId: 't', id: 'p1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return the product output if found', async () => {
      productRepository.findById.mockResolvedValue(makeProduct());
      const result = await useCase.execute({ tenantId: 't', id: 'p1' });
      expect(result.sku).toBe('WG-001');
    });
  });

  describe('executeBySku()', () => {
    it('should throw NotFoundException if product not found by SKU', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      await expect(useCase.executeBySku('t', 'SKU')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the product if found by SKU', async () => {
      const product = makeProduct();
      productRepository.findBySku.mockResolvedValue(product);
      const result = await useCase.executeBySku('t', 'WG-001');
      expect(result.sku).toBe('WG-001');
    });
  });

  describe('executeByBarcode()', () => {
    it('should throw NotFoundException if product not found by barcode', async () => {
      productRepository.findByBarcode.mockResolvedValue(null);
      await expect(useCase.executeByBarcode('t', 'BAR')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the product if found by barcode', async () => {
      const product = makeProduct({ barcode: 'BAR-001' });
      productRepository.findByBarcode.mockResolvedValue(product);
      const result = await useCase.executeByBarcode('t', 'BAR-001');
      expect(result.sku).toBe('WG-001');
    });
  });
});
