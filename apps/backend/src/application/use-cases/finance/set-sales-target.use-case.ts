import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { UseCase } from '../../../common/application/use-case.interface';

export type SetSalesTargetInput = {
  tenantId: string;
  userId: string;
  month: number;
  year: number;
  targetAmount: number;
};

@Injectable()
export class SetSalesTargetUseCase implements UseCase<
  SetSalesTargetInput,
  any
> {
  constructor(private prisma: PrismaService) {}

  async execute(input: SetSalesTargetInput) {
    const { tenantId, userId, month, year, targetAmount } = input;

    const target = await this.prisma.salesTarget.upsert({
      where: {
        tenantId_userId_month_year: {
          tenantId,
          userId,
          month,
          year,
        },
      },
      update: { targetAmount },
      create: { tenantId, userId, month, year, targetAmount },
    });

    return target;
  }
}
