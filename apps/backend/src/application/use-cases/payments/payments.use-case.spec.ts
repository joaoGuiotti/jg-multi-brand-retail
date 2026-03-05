import { NotFoundException } from '@nestjs/common';
import { Payment } from '../../../domain/entities/payments/payment.entity';
import { GetPaymentUseCase } from './get-payment.use-case';
import { ListPaymentsUseCase } from './list-payments.use-case';

const makePayment = (overrides: any = {}) =>
    Payment.create({ saleId: 'sale-1', method: 'CASH', amount: 40, status: 'PAID', installments: 1, fee: 0, ...overrides });

describe('GetPaymentUseCase', () => {
    let useCase: GetPaymentUseCase;
    let paymentRepository: any;

    beforeEach(() => {
        paymentRepository = { findById: jest.fn() };
        useCase = new GetPaymentUseCase(paymentRepository);
    });

    it('should throw NotFoundException if payment not found', async () => {
        paymentRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ tenantId: 't', id: 'p' })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if tenantId does not match (repository returns null)', async () => {
        paymentRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ tenantId: 'tenant-1', id: 'p' })).rejects.toThrow(NotFoundException);
    });

    it('should return payment output if found', async () => {
        paymentRepository.findById.mockResolvedValue(makePayment());
        const result = await useCase.execute({ tenantId: 'tenant-1', id: 'p1' });
        expect(result.method).toBe('CASH');
    });
});

describe('ListPaymentsUseCase', () => {
    let useCase: ListPaymentsUseCase;
    let paymentRepository: any;

    beforeEach(() => {
        paymentRepository = { findAll: jest.fn() };
        useCase = new ListPaymentsUseCase(paymentRepository);
    });

    it('should return a paginated list of payments', async () => {
        paymentRepository.findAll.mockResolvedValue({ data: [makePayment()], total: 1, page: 1, limit: 10, totalPages: 1 });
        const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
    });

    it('should return empty list when no payments', async () => {
        paymentRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
        const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
        expect(result.data).toHaveLength(0);
    });
});
