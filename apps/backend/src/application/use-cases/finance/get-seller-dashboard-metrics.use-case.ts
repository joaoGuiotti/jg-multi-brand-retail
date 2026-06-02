import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { UseCase } from '../../../common/application/use-case.interface';

export type GetSellerDashboardMetricsInput = {
  tenantId: string;
  userId: string;
  month: number;
  year: number;
};

@Injectable()
export class GetSellerDashboardMetricsUseCase
  implements UseCase<GetSellerDashboardMetricsInput, any>
{
  constructor(private prisma: PrismaService) {}

  async execute(input: GetSellerDashboardMetricsInput) {
    const { tenantId, userId, month, year } = input;

    const target = await this.prisma.salesTarget.findUnique({
      where: {
        tenantId_userId_month_year: {
          tenantId,
          userId,
          month,
          year,
        },
      },
    });

    const commissions = await this.prisma.commissionTransaction.aggregate({
      where: {
        tenantId,
        userId,
        status: { not: 'REVERSED' },
        createdAt: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      _sum: {
        commissionAmount: true,
        baseAmount: true,
      },
    });

    const targetAmount = target?.targetAmount ? Number(target.targetAmount) : 0;
    const totalSold = commissions._sum.baseAmount
      ? Number(commissions._sum.baseAmount)
      : 0;
    const commissionEarned = commissions._sum.commissionAmount
      ? Number(commissions._sum.commissionAmount)
      : 0;

    let progressPercentage = 0;
    if (targetAmount > 0) {
      progressPercentage = Math.round((totalSold / targetAmount) * 100);
    }

    return {
      userId,
      month,
      year,
      targetAmount,
      totalSold,
      commissionEarned,
      progressPercentage,
    };
  }
}
