import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { UseCase } from '../../../common/application/use-case.interface';

export type ListCommissionsInput = {
  tenantId: string;
  userId?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
};

export type CommissionTransactionOutput = {
  id: string;
  userId: string;
  userName: string;
  saleId: string;
  baseAmount: number;
  percentageApplied: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
};

export type ListCommissionsOutput = {
  data: CommissionTransactionOutput[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@Injectable()
export class ListCommissionsUseCase implements UseCase<
  ListCommissionsInput,
  ListCommissionsOutput
> {
  constructor(private prisma: PrismaService) {}

  async execute(input: ListCommissionsInput): Promise<ListCommissionsOutput> {
    const { tenantId, userId, month, year, page = 1, limit = 20 } = input;

    const where: any = {
      tenantId,
      status: { not: 'REVERSED' },
    };

    if (userId) where.userId = userId;

    if (month && year) {
      where.createdAt = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    } else if (year) {
      where.createdAt = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.commissionTransaction.count({ where }),
      this.prisma.commissionTransaction.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        userName: item.user.name,
        saleId: item.saleId,
        baseAmount: Number(item.baseAmount),
        percentageApplied: Number(item.percentageApplied),
        commissionAmount: Number(item.commissionAmount),
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
