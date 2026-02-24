import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Payment } from '../../../../domain/entities/payments/payment.entity';
import { CreatePaymentUseCase } from '../create-payment.use-case';

const makePayment = (overrides: any = {}) =>
    Payment.create({ tenantId: 'tenant-1', saleId: 'sale-1', method: 'CASH', amount: 40, status: 'PAID', installments: 1, fee: 0, ...overrides });

const makePrismaSale = (overrides: any = {}) => ({
    id: 'sale-1',
    tenantId: 'tenant-1',
    total: { toNumber: () => 100 },
    status: 'PENDING',
    payments: [],
    ...overrides,
});

describe('CreatePaymentUseCase', () => {
    let useCase: CreatePaymentUseCase;
    let paymentRepository: any;
    let prisma: any;

    beforeEach(() => {
        paymentRepository = { create: jest.fn() };
        prisma = {
            sale: {
                findFirst: jest.fn(),
                update: jest.fn(),
            },
        };
        useCase = new CreatePaymentUseCase(paymentRepository, prisma as any);
    });

    const baseInput = {
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        method: 'CASH' as const,
        amount: 40,
        installments: 1,
        fee: 0,
    };

    it('should throw NotFoundException if sale not found', async () => {
        prisma.sale.findFirst.mockResolvedValue(null);
        await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if sale is cancelled', async () => {
        prisma.sale.findFirst.mockResolvedValue(makePrismaSale({ status: 'CANCELLED' }));
        await expect(useCase.execute(baseInput)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment exceeds remaining balance', async () => {
        prisma.sale.findFirst.mockResolvedValue(makePrismaSale({
            total: { toNumber: () => 50 },
            payments: [{ amount: { toNumber: () => 40 } }],
        }));
        await expect(useCase.execute({ ...baseInput, amount: 20 })).rejects.toThrow(BadRequestException);
    });

    it('should create payment and return output', async () => {
        const payment = makePayment();
        prisma.sale.findFirst.mockResolvedValue(makePrismaSale());
        paymentRepository.create.mockResolvedValue(payment);

        const result = await useCase.execute(baseInput);
        expect(result).toBeDefined();
        expect(paymentRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should mark sale as COMPLETED when fully paid', async () => {
        const sale = makePrismaSale({ total: { toNumber: () => 40 }, payments: [] });
        prisma.sale.findFirst.mockResolvedValue(sale);
        paymentRepository.create.mockImplementation(async (p) => p);

        await useCase.execute({ ...baseInput, amount: 40 });
        expect(prisma.sale.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { status: 'COMPLETED' } })
        );
    });

    it('should not mark sale as COMPLETED when partially paid', async () => {
        prisma.sale.findFirst.mockResolvedValue(makePrismaSale({ total: { toNumber: () => 100 }, payments: [] }));
        paymentRepository.create.mockImplementation(async (p) => p);

        await useCase.execute({ ...baseInput, amount: 40 });
        expect(prisma.sale.update).not.toHaveBeenCalled();
    });
});
