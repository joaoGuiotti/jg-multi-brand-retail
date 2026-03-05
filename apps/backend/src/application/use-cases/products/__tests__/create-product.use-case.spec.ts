import { ConflictException } from '@nestjs/common';
import { Product } from '../../../../domain/entities/products/product.entity';
import { CreateProductUseCase } from '../create-product.use-case';

const makeInput = (overrides: any = {}) => ({
    tenantId: 'tenant-1',
    name: 'Widget',
    sku: 'WG-001',
    costPrice: 10,
    salePrice: 20,
    ...overrides,
});

const makeProduct = (overrides: any = {}) =>
    Product.create({
        name: 'Widget',
        sku: 'WG-001',
        costPrice: 10,
        salePrice: 20,
        margin: 100,
        stockQuantity: 0,
        unit: 'UN',
        active: true,
        ...overrides,
    });

describe('CreateProductUseCase', () => {
    let useCase: CreateProductUseCase;
    let productRepository: any;

    beforeEach(() => {
        productRepository = {
            findBySku: jest.fn(),
            create: jest.fn(),
        };
        useCase = new CreateProductUseCase(productRepository);
    });

    it('should throw ConflictException if SKU already exists', async () => {
        productRepository.findBySku.mockResolvedValue(makeProduct());
        await expect(useCase.execute(makeInput())).rejects.toThrow(ConflictException);
    });

    it('should create and return a product', async () => {
        const product = makeProduct();
        productRepository.findBySku.mockResolvedValue(null);
        productRepository.create.mockResolvedValue(product);

        const result = await useCase.execute(makeInput());
        expect(result).toBeDefined();
        expect(result.sku).toBe('WG-001');
        expect(productRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should calculate margin if not provided', async () => {
        const product = makeProduct();
        productRepository.findBySku.mockResolvedValue(null);
        productRepository.create.mockResolvedValue(product);

        await useCase.execute(makeInput({ costPrice: 10, salePrice: 20 }));
        const createdArg = productRepository.create.mock.calls[0][1];
        expect(createdArg.margin).toBe(100);
    });

    it('should use 0 margin when costPrice is 0', async () => {
        const product = makeProduct({ costPrice: 0, margin: 0 });
        productRepository.findBySku.mockResolvedValue(null);
        productRepository.create.mockResolvedValue(product);

        await useCase.execute(makeInput({ costPrice: 0, salePrice: 20 }));
        const createdArg = productRepository.create.mock.calls[0][1];
        expect(createdArg.margin).toBe(0);
    });

    it('should apply default unit and stockQuantity', async () => {
        const product = makeProduct();
        productRepository.findBySku.mockResolvedValue(null);
        productRepository.create.mockResolvedValue(product);

        await useCase.execute(makeInput());
        const createdArg = productRepository.create.mock.calls[0][1];
        expect(createdArg.unit).toBe('UN');
        expect(createdArg.stockQuantity).toBe(0);
        expect(createdArg.active).toBe(true);
    });
});
