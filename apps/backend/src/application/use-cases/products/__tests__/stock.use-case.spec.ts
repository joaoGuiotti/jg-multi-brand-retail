import { NotFoundException } from '@nestjs/common';
import { Product } from '../../../../domain/entities/products/product.entity';
import { AdjustStockUseCase } from '../adjust-stock.use-case';
import { UpdateStockUseCase } from '../update-stock.use-case';

const makeProduct = (overrides: any = {}) =>
    Product.create({ name: 'Widget', sku: 'WG-001', costPrice: 10, salePrice: 20, margin: 100, stockQuantity: 10, unit: 'UN', active: true, ...overrides });

describe('UpdateStockUseCase', () => {
    let useCase: UpdateStockUseCase;
    let productRepository: any;

    beforeEach(() => {
        productRepository = { findById: jest.fn(), update: jest.fn() };
        useCase = new UpdateStockUseCase(productRepository);
    });

    it('should throw NotFoundException if product not found', async () => {
        productRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ tenantId: 't', id: 'p', quantity: 5 })).rejects.toThrow(NotFoundException);
    });

    it('should set stock absolutely and return updated product', async () => {
        const product = makeProduct({ stockQuantity: 10 });
        productRepository.findById.mockResolvedValue(product);
        productRepository.update.mockResolvedValue(product);

        await useCase.execute({ tenantId: 'tenant-1', id: 'p1', quantity: 50 });
        expect(product.stockQuantity).toBe(50);
        expect(productRepository.update).toHaveBeenCalledWith('tenant-1', product);
    });
});

describe('AdjustStockUseCase', () => {
    let useCase: AdjustStockUseCase;
    let productRepository: any;

    beforeEach(() => {
        productRepository = { findById: jest.fn(), update: jest.fn() };
        useCase = new AdjustStockUseCase(productRepository);
    });

    it('should throw NotFoundException if product not found', async () => {
        productRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ tenantId: 't', id: 'p', adjustment: 5 })).rejects.toThrow(NotFoundException);
    });

    it('should adjust stock and return updated product', async () => {
        const product = makeProduct({ stockQuantity: 10 });
        productRepository.findById.mockResolvedValue(product);
        productRepository.update.mockResolvedValue(product);

        await useCase.execute({ tenantId: 'tenant-1', id: 'p1', adjustment: 5 });
        expect(product.stockQuantity).toBe(15);
        expect(productRepository.update).toHaveBeenCalledWith('tenant-1', product);
    });

    it('should decrease stock with negative adjustment', async () => {
        const product = makeProduct({ stockQuantity: 10 });
        productRepository.findById.mockResolvedValue(product);
        productRepository.update.mockResolvedValue(product);

        await useCase.execute({ tenantId: 'tenant-1', id: 'p1', adjustment: -3 });
        expect(product.stockQuantity).toBe(7);
    });
});
