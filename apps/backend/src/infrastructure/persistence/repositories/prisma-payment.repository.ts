import { Injectable } from '@nestjs/common';
import { Payment } from '../../../domain/entities/payments/payment.entity';
import { PaymentFilters, PaymentRepository, PaymentSearchResult } from '../../../domain/repositories/payment-repository';
import { PaymentMapper } from '../mappers/payment.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, payment: Payment): Promise<void> {
        const data = PaymentMapper.toPersistence(payment);
        await this.prisma.payment.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async findById(tenantId: string, id: string): Promise<Payment | null> {
        const payment = await this.prisma.payment.findFirst({
            where: { id, tenantId },
        });
        if (!payment) return null;
        return PaymentMapper.toDomain(payment);
    }

    async findAll(tenantId: string, filters: PaymentFilters): Promise<PaymentSearchResult> {
        const { saleId, status, method, sortBy, sortOrder } = filters;

        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = { tenantId };
        if (saleId) where.saleId = saleId;
        if (status) where.status = status;
        if (method) where.method = method;

        const orderBy = sortBy
            ? { [sortBy]: sortOrder || ('desc' as const) }
            : { createdAt: 'desc' as const };

        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({ where, skip, take: limit, orderBy }),
            this.prisma.payment.count({ where }),
        ]);

        return {
            data: payments.map(PaymentMapper.toDomain),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findBySale(tenantId: string, saleId: string): Promise<Payment[]> {
        const payments = await this.prisma.payment.findMany({
            where: { saleId, tenantId },
        });
        return payments.map(PaymentMapper.toDomain);
    }

    async update(tenantId: string, payment: Payment): Promise<void> {
        const data = PaymentMapper.toPersistence(payment);
        await this.prisma.payment.update({
            where: {
                id: payment.id.toString(),
                tenantId,
            },
            data,
        });
    }
}
