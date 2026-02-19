import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, QueryPaymentDto } from './dto';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, dto: CreatePaymentDto) {
        // Verify sale exists and belongs to tenant
        const sale = await this.prisma.sale.findFirst({
            where: {
                id: dto.saleId,
                tenantId,
            },
            include: {
                payments: true,
            },
        });

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        if (sale.status === 'CANCELLED') {
            throw new BadRequestException('Cannot add payment to cancelled sale');
        }

        // Calculate total paid so far
        const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
        const saleTotal = sale.total.toNumber();
        const remaining = saleTotal - totalPaid;

        // Validate payment amount
        if (dto.amount > remaining) {
            throw new BadRequestException(
                `Payment amount (${dto.amount}) exceeds remaining balance (${remaining})`,
            );
        }

        // Create payment
        const payment = await this.prisma.payment.create({
            data: {
                tenantId,
                saleId: dto.saleId,
                method: dto.method,
                amount: dto.amount,
                status: 'PAID',
            },
            include: {
                sale: {
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });

        // Check if sale is now fully paid
        const newTotalPaid = totalPaid + dto.amount;
        if (newTotalPaid >= saleTotal && sale.status === 'PENDING') {
            await this.prisma.sale.update({
                where: { id: dto.saleId },
                data: { status: 'COMPLETED' },
            });
        }

        return payment;
    }

    async findAll(tenantId: string, query: QueryPaymentDto) {
        const { saleId, method, startDate, endDate, sortBy, sortOrder } = query;

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {
            sale: {
                tenantId,
            },
        };

        if (saleId) {
            where.saleId = saleId;
        }

        if (method) {
            where.method = method;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip: skip || 0,
                take: limit || 10,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    sale: {
                        select: {
                            id: true,
                            total: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            this.prisma.payment.count({ where }),
        ]);

        return {
            data: payments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(tenantId: string, id: string) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                id,
                sale: {
                    tenantId,
                },
            },
            include: {
                sale: {
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        return payment;
    }

    async findBySale(tenantId: string, saleId: string) {
        // Verify sale belongs to tenant
        const sale = await this.prisma.sale.findFirst({
            where: {
                id: saleId,
                tenantId,
            },
        });

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        const payments = await this.prisma.payment.findMany({
            where: {
                saleId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
        const saleTotal = sale.total.toNumber();

        return {
            payments,
            summary: {
                total: saleTotal,
                paid: totalPaid,
                remaining: saleTotal - totalPaid,
                status: sale.status,
            },
        };
    }

    async cancel(tenantId: string, id: string) {
        const payment = await this.findOne(tenantId, id);

        if (payment.status === 'CANCELLED') {
            throw new BadRequestException('Payment is already cancelled');
        }

        if (payment.sale.status === 'COMPLETED') {
            throw new BadRequestException(
                'Cannot cancel payment for completed sale. Cancel the sale first.',
            );
        }

        return this.prisma.payment.update({
            where: { id },
            data: {
                status: 'CANCELLED',
            },
            include: {
                sale: true,
            },
        });
    }
}
