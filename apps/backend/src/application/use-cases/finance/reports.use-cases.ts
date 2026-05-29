import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { UseCase } from '../../../common/application/use-case.interface';

@Injectable()
export class GetCashFlowUseCase implements UseCase<
  { tenantId: string; month: number; year: number },
  any
> {
  constructor(private prisma: PrismaService) {}

  async execute(input: { tenantId: string; month: number; year: number }) {
    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

    const accounts = await this.prisma.financialAccount.findMany({
      where: {
        tenantId: input.tenantId,
        paidAt: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
    });

    let totalInflows = 0;
    let totalOutflows = 0;
    const entriesMap = new Map<
      string,
      { inflows: number; outflows: number; balance: number }
    >();

    accounts.forEach((acc) => {
      if (!acc.paidAt) return;
      const dateStr = acc.paidAt.toISOString().split('T')[0];
      if (!entriesMap.has(dateStr))
        entriesMap.set(dateStr, { inflows: 0, outflows: 0, balance: 0 });

      const entry = entriesMap.get(dateStr);
      const amount = Number(acc.amount);

      if (entry) {
        if (acc.type === 'RECEIVABLE') {
          entry.inflows += amount;
          totalInflows += amount;
        } else {
          entry.outflows += amount;
          totalOutflows += amount;
        }
        entry.balance = entry.inflows - entry.outflows;
      }
    });

    const entries = Array.from(entriesMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      entries,
      totalInflows,
      totalOutflows,
      netCashFlow: totalInflows - totalOutflows,
    };
  }
}

@Injectable()
export class CalculateDREUseCase implements UseCase<
  { tenantId: string; month: number; year: number },
  any
> {
  constructor(private prisma: PrismaService) {}

  async execute(input: { tenantId: string; month: number; year: number }) {
    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

    // Gross Revenue = Total of Sales in that period (completed)
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId: input.tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      include: { items: true },
    });

    let grossRevenue = 0;
    let cmv = 0;

    sales.forEach((sale) => {
      grossRevenue += Number(sale.total);
      sale.items.forEach((item) => {
        // use costPriceAtSale if exists
        const cost = item.costPriceAtSale ? Number(item.costPriceAtSale) : 0;
        cmv += cost * item.quantity;
      });
    });

    const grossProfit = grossRevenue - cmv;

    // Expenses = Paid PAYABLES (except category SALE/CMV related if any, assume all other are OPEX)
    const expensesAccounts = await this.prisma.financialAccount.findMany({
      where: {
        tenantId: input.tenantId,
        paidAt: { gte: startDate, lte: endDate },
        type: 'PAYABLE',
        status: 'PAID',
      },
    });

    const expenses = expensesAccounts.reduce(
      (sum, acc) => sum + Number(acc.amount),
      0,
    );
    const netProfit = grossProfit - expenses;

    return {
      grossRevenue,
      cmv,
      grossProfit,
      expenses,
      netProfit,
    };
  }
}
