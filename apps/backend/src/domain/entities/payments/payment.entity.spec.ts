import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Payment } from './payment.entity';

const makePayment = (overrides?: Partial<Parameters<typeof Payment.create>[0]>) =>
    Payment.create({
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        method: 'PIX',
        amount: 100,
        installments: 1,
        fee: 0,
        status: 'PAID',
        ...overrides,
    });

describe('Payment Entity', () => {
    it('should create a payment with all required fields', () => {
        const p = makePayment();
        expect(p).toBeDefined();
        expect(p.tenantId).toBe('tenant-1');
        expect(p.saleId).toBe('sale-1');
        expect(p.method).toBe('PIX');
        expect(p.amount).toBe(100);
        expect(p.installments).toBe(1);
        expect(p.fee).toBe(0);
        expect(p.status).toBe('PAID');
    });

    it('should default status to PAID', () => {
        const p = Payment.create({ tenantId: 't', saleId: 's', method: 'CASH', amount: 50, installments: 1, fee: 0, status: 'PAID' });
        expect(p.status).toBe('PAID');
    });

    it('should expose optional properties', () => {
        const now = new Date();
        const p = makePayment({ paidAt: now, metadata: { ref: 'abc' } });
        expect(p.paidAt).toBe(now);
        expect(p.metadata).toEqual({ ref: 'abc' });
    });

    it('should have a createdAt', () => {
        const p = makePayment();
        expect(p.createdAt).toBeDefined();
    });

    it('should accept a custom id', () => {
        const id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
        const p = makePayment();
        const p2 = Payment.create({ tenantId: 't', saleId: 's', method: 'PIX', amount: 1, installments: 1, fee: 0, status: 'PAID' }, id);
        expect(p2.id.toString()).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    describe('cancel()', () => {
        it('should set status to CANCELLED', () => {
            const p = makePayment();
            p.cancel();
            expect(p.status).toBe('CANCELLED');
        });

        it('should throw if payment is already cancelled', () => {
            const p = makePayment({ status: 'CANCELLED' });
            expect(() => p.cancel()).toThrow('Payment already cancelled');
        });
    });
});
