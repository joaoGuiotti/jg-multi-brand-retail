import { Product } from '../../../../domain/entities/products/product.entity';
import { ListProductsUseCase } from '../list-products.use-case';

const makeProduct = (sku: string) =>
    Product.create({ tenantId: 'tenant-1', name: 'Widget', sku, costPrice: 10, salePrice: 20, margin: 100, stockQuantity: 5, unit: 'UN', active: true });

describe('ListProductsUseCase', () => {
    let useCase: ListProductsUseCase;
    let productRepository: any;

    beforeEach(() => {
        productRepository = { findAll: jest.fn() };
        useCase = new ListProductsUseCase(productRepository);
    });

    it('should return a paginated list of products', async () => {
        const products = [makeProduct('WG-001'), makeProduct('WG-002')];
        productRepository.findAll.mockResolvedValue({ data: products, total: 2, page: 1, limit: 10, totalPages: 1 });

        const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
        expect(result.data).toHaveLength(2);
        expect(result.meta.total).toBe(2);
    });

    it('should return empty list when no products found', async () => {
        productRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });

        const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
        expect(result.data).toHaveLength(0);
        expect(result.meta.total).toBe(0);
    });
});
