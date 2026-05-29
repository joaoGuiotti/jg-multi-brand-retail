import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { CreateAccountDto } from '../../../infrastructure/dtos/finance/finance.dto';
import { UseCase } from '../../../common/application/use-case.interface';

const mapAccount = (acc: any) => ({
  ...acc,
  amount: Number(acc.amount),
  dueDate: acc.dueDate?.toISOString(),
  paidAt: acc.paidAt?.toISOString() || null,
  createdAt: acc.createdAt?.toISOString(),
  updatedAt: acc.updatedAt?.toISOString(),
});

@Injectable()
export class CreateAccountUseCase implements UseCase<CreateAccountDto & { tenantId: string }, any> {
  constructor(private prisma: PrismaService) {}

  async execute(input: CreateAccountDto & { tenantId: string }) {
    const acc = await this.prisma.financialAccount.create({
      data: {
        tenantId: input.tenantId,
        type: input.type,
        description: input.description,
        amount: input.amount,
        dueDate: new Date(input.dueDate),
        category: input.category,
        saleId: input.saleId,
      },
    });
    return mapAccount(acc);
  }
}

@Injectable()
export class PayAccountUseCase implements UseCase<{ tenantId: string, id: string, paidAt: string }, any> {
  constructor(private prisma: PrismaService) {}

  async execute(input: { tenantId: string, id: string, paidAt: string }) {
    const account = await this.prisma.financialAccount.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
    });

    if (!account) throw new NotFoundException('Account not found');

    const updated = await this.prisma.financialAccount.update({
      where: { id: input.id },
      data: {
        status: 'PAID',
        paidAt: new Date(input.paidAt),
      },
    });
    return mapAccount(updated);
  }
}

@Injectable()
export class ListAccountsUseCase implements UseCase<{ tenantId: string, type?: string, status?: string, startDate?: string, endDate?: string }, any[]> {
  constructor(private prisma: PrismaService) {}

  async execute(input: { tenantId: string, type?: string, status?: string, startDate?: string, endDate?: string }) {
    const where: any = { tenantId: input.tenantId };
    
    if (input.type) where.type = input.type;
    if (input.status) where.status = input.status;
    if (input.startDate && input.endDate) {
      where.dueDate = {
        gte: new Date(input.startDate),
        lte: new Date(input.endDate),
      };
    }

    const accounts = await this.prisma.financialAccount.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
    
    return accounts.map(mapAccount);
  }
}
