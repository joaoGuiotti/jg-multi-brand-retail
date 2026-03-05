import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Product, ProductProps } from './product.entity';

const baseProps: ProductProps = {
    name: 'Test Product',
    sku: 'SKU-001',
    costPrice: 10,
    salePrice: 20,
    margin: 100,
    stockQuantity: 10,
    unit: 'UN',
    active: true,
};

const makeProduct = (overrides: Partial<ProductProps> = {}) =>
    Product.create({ ...baseProps, ...overrides });

describe('Product Entity', () => {
    it('should create a product with all required fields', () => {
        const p = makeProduct();
        expect(p).toBeDefined();
        expect(p.name).toBe('Test Product');
        expect(p.sku).toBe('SKU-001');
    });

    it('should generate a UUID id if not provided', () => {
        const p = makeProduct();
        expect(p.id).toBeInstanceOf(UniqueEntityID);
    });

    it('should use a provided id', () => {
        const id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
        const p = Product.create(baseProps, id);
        expect(p.id.toString()).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should set default values for dates', () => {
        const p = makeProduct();
        expect(p.createdAt).toBeDefined();
        expect(p.updatedAt).toBeDefined();
    });

    it('should expose all optional properties', () => {
        const p = makeProduct({
            description: 'desc',
            barcode: '123456',
            categoryId: 'cat-1',
            brandId: 'brand-1',
            supplierId: 'sup-1',
            metadata: { key: 'value' },
        });
        expect(p.description).toBe('desc');
        expect(p.barcode).toBe('123456');
        expect(p.categoryId).toBe('cat-1');
        expect(p.brandId).toBe('brand-1');
        expect(p.supplierId).toBe('sup-1');
        expect(p.metadata).toEqual({ key: 'value' });
        expect(p.costPrice).toBe(10);
        expect(p.salePrice).toBe(20);
        expect(p.margin).toBe(100);
        expect(p.unit).toBe('UN');
    });

    describe('updateStock()', () => {
        it('should set the stock quantity absolutely', () => {
            const p = makeProduct({ stockQuantity: 10 });
            p.updateStock(50);
            expect(p.stockQuantity).toBe(50);
        });

        it('should update updatedAt', () => {
            const p = makeProduct();
            const before = p.updatedAt;
            p.updateStock(5);
            expect(p.updatedAt).not.toBe(before);
        });
    });

    describe('adjustStock()', () => {
        it('should increase stock by the given amount', () => {
            const p = makeProduct({ stockQuantity: 10 });
            p.adjustStock(5);
            expect(p.stockQuantity).toBe(15);
        });

        it('should decrease stock with a negative amount', () => {
            const p = makeProduct({ stockQuantity: 10 });
            p.adjustStock(-3);
            expect(p.stockQuantity).toBe(7);
        });

        it('should update updatedAt', () => {
            const p = makeProduct();
            const before = p.updatedAt;
            p.adjustStock(1);
            expect(p.updatedAt).not.toBe(before);
        });
    });

    describe('updatePrices()', () => {
        it('should update costPrice and salePrice', () => {
            const p = makeProduct();
            p.updatePrices(5, 15);
            expect(p.costPrice).toBe(5);
            expect(p.salePrice).toBe(15);
        });

        it('should recalculate margin correctly', () => {
            const p = makeProduct();
            p.updatePrices(10, 20);
            expect(p.margin).toBe(100);
        });

        it('should return 0 margin when costPrice is 0', () => {
            const p = makeProduct();
            p.updatePrices(0, 20);
            expect(p.margin).toBe(0);
        });
    });

    it('toJson() should return a plain object with id', () => {
        const p = makeProduct();
        const json = p.toJson();
        expect(json.id).toBeDefined();
        expect(json.name).toBe('Test Product');
        expect(json.sku).toBe('SKU-001');
    });
});
