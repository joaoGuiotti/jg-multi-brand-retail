import { UseCase } from '@common/application/use-case.interface';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

export type GetDashboardSnapshotInput = { tenantId: string };

export interface DashboardRecentSaleOutput {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  customerId: string | null;
}

export interface DashboardRecentMovementOutput {
  id: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  createdAt: string;
}

export interface DashboardDailyRevenueOutput {
  date: string;
  revenue: number;
}

export interface GetDashboardSnapshotOutput {
  kpis: {
    revenueToday: number;
    salesToday: number;
    lowStock: number;
    outOfStock: number;
    totalProducts: number;
  };
  recentSales: DashboardRecentSaleOutput[];
  recentMovements: DashboardRecentMovementOutput[];
  dailyRevenue: DashboardDailyRevenueOutput[];
}

@Injectable()
export class GetDashboardSnapshotUseCase implements UseCase<
  GetDashboardSnapshotInput,
  GetDashboardSnapshotOutput
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: GetDashboardSnapshotInput,
  ): Promise<GetDashboardSnapshotOutput> {
    const { tenantId } = input;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      completedTodaySales,
      recentSales,
      lowStock,
      outOfStock,
      totalProducts,
      recentMovements,
    ] = await Promise.all([
      // Completed sales today — for KPI revenue + count
      this.prisma.sale.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: { gte: todayStart },
        },
        select: { id: true, total: true },
      }),

      // Last 6 sales (any status) — for recent sales feed
      this.prisma.sale.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          customerId: true,
          items: { select: { quantity: true } },
        },
      }),

      // Low stock count (1–10 units)
      this.prisma.product.count({
        where: { tenantId, stockQuantity: { gt: 0, lte: 10 } },
      }),

      // Out of stock count (0 units)
      this.prisma.product.count({
        where: { tenantId, stockQuantity: 0 },
      }),

      // Total product count
      this.prisma.product.count({ where: { tenantId } }),

      // Last 6 inventory movements — for recent movements feed
      this.prisma.inventoryMovement.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          productId: true,
          type: true,
          quantity: true,
          createdAt: true,
          product: { select: { name: true } },
        },
      }),
    ]);

    // 7-day daily revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const salesLast7Days = await this.prisma.sale.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      select: { total: true, createdAt: true },
    });

    // Build 7-day revenue series (one entry per date, 0 if no sales)
    const revenueByDate = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      revenueByDate.set(key, 0);
    }
    for (const sale of salesLast7Days) {
      const key = sale.createdAt.toISOString().split('T')[0];
      if (revenueByDate.has(key)) {
        revenueByDate.set(
          key,
          (revenueByDate.get(key) ?? 0) + Number(sale.total),
        );
      }
    }

    const revenueToday = completedTodaySales.reduce(
      (sum, s) => sum + Number(s.total),
      0,
    );

    return {
      kpis: {
        revenueToday,
        salesToday: completedTodaySales.length,
        lowStock,
        outOfStock,
        totalProducts,
      },
      recentSales: recentSales.map((s) => ({
        id: s.id,
        total: Number(s.total),
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        customerId: s.customerId ?? null,
        itemCount: s.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.product.name,
        type: m.type,
        quantity: m.quantity,
        createdAt: m.createdAt.toISOString(),
      })),
      dailyRevenue: Array.from(revenueByDate.entries()).map(
        ([date, revenue]) => ({ date, revenue }),
      ),
    };
  }
}
