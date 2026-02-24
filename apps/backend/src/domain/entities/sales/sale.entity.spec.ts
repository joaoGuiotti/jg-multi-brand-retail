import { Sale, SaleItem } from './sale.entity';

const makeSaleItem = () =>
    SaleItem.create({ productId: 'prod-1', quantity: 2, unitPrice: 10, discount: 0, total: 20 });

const makeSale = (overrides?: Partial<Parameters<typeof Sale.create>[0]>) =>
    Sale.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        subtotal: 20,
        discount: 0,
        total: 20,
        status: 'PENDING',
        items: [makeSaleItem()],
        ...overrides,
    });

describe('SaleItem Entity', () => {
    it('should create a sale item', () => {
        const item = makeSaleItem();
        expect(item.productId).toBe('prod-1');
        expect(item.quantity).toBe(2);
        expect(item.unitPrice).toBe(10);
        expect(item.discount).toBe(0);
        expect(item.total).toBe(20);
    });
});

describe('Sale Entity', () => {
    it('should create a sale with required fields', () => {
        const sale = makeSale();
        expect(sale).toBeDefined();
        expect(sale.tenantId).toBe('tenant-1');
        expect(sale.userId).toBe('user-1');
        expect(sale.status).toBe('PENDING');
        expect(sale.items).toHaveLength(1);
    });

    it('should expose all properties', () => {
        const sale = makeSale({ invoiceNumber: 'INV-001', discount: 5, subtotal: 25 });
        expect(sale.invoiceNumber).toBe('INV-001');
        expect(sale.subtotal).toBe(25);
        expect(sale.discount).toBe(5);
        expect(sale.total).toBe(20);
        expect(sale.createdAt).toBeDefined();
        expect(sale.updatedAt).toBeDefined();
    });

    describe('cancel()', () => {
        it('should set status to CANCELLED', () => {
            const sale = makeSale();
            sale.cancel();
            expect(sale.status).toBe('CANCELLED');
        });

        it('should throw if sale is already cancelled', () => {
            const sale = makeSale({ status: 'CANCELLED' });
            expect(() => sale.cancel()).toThrow('Sale already cancelled');
        });

        it('should throw if sale is completed', () => {
            const sale = makeSale({ status: 'COMPLETED' });
            expect(() => sale.cancel()).toThrow('Cannot cancel a completed sale');
        });
    });

    describe('complete()', () => {
        it('should set status to COMPLETED when fully paid', () => {
            const sale = makeSale({ total: 20 });
            sale.complete(20);
            expect(sale.status).toBe('COMPLETED');
        });

        it('should throw if sale is already completed', () => {
            const sale = makeSale({ status: 'COMPLETED' });
            expect(() => sale.complete(20)).toThrow('Sale already completed');
        });

        it('should throw if sale is cancelled', () => {
            const sale = makeSale({ status: 'CANCELLED' });
            expect(() => sale.complete(20)).toThrow('Cannot complete a cancelled sale');
        });

        it('should throw if total paid is less than sale total', () => {
            const sale = makeSale({ total: 100 });
            expect(() => sale.complete(50)).toThrow('Insufficient payments');
        });
    });
});
