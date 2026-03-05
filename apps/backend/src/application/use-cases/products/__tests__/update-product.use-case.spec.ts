import { ConflictException, NotFoundException } from '@nestjs/common';
import { Product } from '../../../../domain/entities/products/product.entity';
import { UpdateProductUseCase } from '../update-product.use-case';

const makeProduct = (overrides: any = {}) =>
    Product.create({ name: 'Widget', sku: 'WG-001', costPrice: 10, salePrice: 20, margin: 100, stockQuantity: 5, unit: 'UN', active: true, ...overrides });

describe('UpdateProductUseCase', () => {
    let useCase: UpdateProductUseCase;
    let productRepository: any;

    beforeEach(() => {
        productRepository = { findById: jest.fn(), findBySku: jest.fn(), update: jest.fn() };
        useCase = new UpdateProductUseCase(productRepository);
    });

    const baseInput = { tenantId: 'tenant-1', id: 'prod-1' };

    it('should throw NotFoundException if product is not found', async () => {
        productRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new SKU is already taken', async () => {
        const product = makeProduct();
        const conflictProduct = makeProduct({ sku: 'WG-002' });
        productRepository.findById.mockResolvedValue(product);
        productRepository.findBySku.mockResolvedValue(conflictProduct);
        await expect(useCase.execute({ ...baseInput, sku: 'WG-002' })).rejects.toThrow(ConflictException);
    });

    it('should update and return the product', async () => {
        const product = makeProduct();
        const updated = makeProduct({ name: 'Updated Widget' });
        productRepository.findById.mockResolvedValue(product);
        productRepository.findBySku.mockResolvedValue(null);
        productRepository.update.mockResolvedValue(updated);

        const result = await useCase.execute({ ...baseInput, name: 'Updated Widget' });
        expect(result.name).toBe('Updated Widget');
    });

    it('should update prices when costPrice is provided', async () => {
        const product = makeProduct();
        productRepository.findById.mockResolvedValue(product);
        productRepository.update.mockResolvedValue(product);

        await useCase.execute({ ...baseInput, costPrice: 15, salePrice: 30 });
        expect(product.costPrice).toBe(15);
        expect(product.salePrice).toBe(30);
    });

    it('should not check SKU conflict if sku is the same as current', async () => {
        const product = makeProduct();
        productRepository.findById.mockResolvedValue(product);
        productRepository.update.mockResolvedValue(product);

        await useCase.execute({ ...baseInput, sku: 'WG-001' });
        expect(productRepository.findBySku).not.toHaveBeenCalled();
    });
});
