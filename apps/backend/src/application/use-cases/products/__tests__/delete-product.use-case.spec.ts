import { NotFoundException } from '@nestjs/common';
import { Product } from '../../../../domain/entities/products/product.entity';
import { DeleteProductUseCase } from '../delete-product.use-case';

const makeProduct = () =>
    Product.create({ name: 'Widget', sku: 'WG-001', costPrice: 10, salePrice: 20, margin: 100, stockQuantity: 5, unit: 'UN', active: true });

describe('DeleteProductUseCase', () => {
    let useCase: DeleteProductUseCase;
    let productRepository: any;

    beforeEach(() => {
        productRepository = { findById: jest.fn(), delete: jest.fn() };
        useCase = new DeleteProductUseCase(productRepository);
    });

    it('should throw NotFoundException if product is not found', async () => {
        productRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ tenantId: 't', id: 'p' })).rejects.toThrow(NotFoundException);
    });

    it('should delete the product if found', async () => {
        productRepository.findById.mockResolvedValue(makeProduct());
        await useCase.execute({ tenantId: 'tenant-1', id: 'p1' });
        expect(productRepository.delete).toHaveBeenCalledWith('tenant-1', 'p1');
    });
});
