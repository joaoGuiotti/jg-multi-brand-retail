import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Payment } from '../../../../domain/entities/payments/payment.entity';
import { CancelPaymentUseCase } from '../cancel-payment.use-case';

const makePayment = (overrides: any = {}) =>
    Payment.create({ tenantId: 'tenant-1', saleId: 'sale-1', method: 'CASH', amount: 40, status: 'PAID', installments: 1, fee: 0, ...overrides });

describe('CancelPaymentUseCase', () => {
    let useCase: CancelPaymentUseCase;
    let paymentRepository: any;
    let prisma: any;

    beforeEach(() => {
        paymentRepository = { findById: jest.fn(), update: jest.fn() };
        prisma = { sale: { findUnique: jest.fn() } };
        useCase = new CancelPaymentUseCase(paymentRepository, prisma as any);
    });

    it('should throw NotFoundException if payment not found', async () => {
        paymentRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ tenantId: 't', id: 'p' })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if tenantId does not match', async () => {
        paymentRepository.findById.mockResolvedValue(makePayment({ tenantId: 'other-tenant' }));
        await expect(useCase.execute({ tenantId: 'tenant-1', id: 'p' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment is already cancelled', async () => {
        paymentRepository.findById.mockResolvedValue(makePayment({ status: 'CANCELLED' }));
        await expect(useCase.execute({ tenantId: 'tenant-1', id: 'p' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sale is completed', async () => {
        paymentRepository.findById.mockResolvedValue(makePayment());
        prisma.sale.findUnique.mockResolvedValue({ status: 'COMPLETED' });
        await expect(useCase.execute({ tenantId: 'tenant-1', id: 'p' })).rejects.toThrow(BadRequestException);
    });

    it('should cancel the payment and return output', async () => {
        const payment = makePayment();
        paymentRepository.findById.mockResolvedValue(payment);
        prisma.sale.findUnique.mockResolvedValue({ status: 'PENDING' });
        paymentRepository.update.mockImplementation(async (p) => p);

        const result = await useCase.execute({ tenantId: 'tenant-1', id: 'p1' });
        expect(result.status).toBe('CANCELLED');
    });
});
