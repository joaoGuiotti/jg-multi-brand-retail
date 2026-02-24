import { UseCase } from '@common/application/use-case.interface';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { StockSummaryOutput } from './common/movement-output';

export type GetStockSummaryInput = { tenantId: string };

@Injectable()
export class GetStockSummaryUseCase implements UseCase<GetStockSummaryInput, StockSummaryOutput> {
    constructor(private prisma: PrismaService) { }

    async execute(input: GetStockSummaryInput): Promise<StockSummaryOutput> {
        const { tenantId } = input;

        const [lowStock, outOfStock, totalProducts] = await Promise.all([
            this.prisma.product.count({
                where: { tenantId, stockQuantity: { gt: 0, lte: 10 } },
            }),
            this.prisma.product.count({
                where: { tenantId, stockQuantity: 0 },
            }),
            this.prisma.product.count({ where: { tenantId } }),
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMovements = await this.prisma.inventoryMovement.groupBy({
            by: ['type'],
            where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
            _count: { type: true },
        });

        const movementsByType = recentMovements.reduce((acc, curr) => {
            acc[curr.type] = curr._count.type;
            return acc;
        }, {} as Record<string, number>);

        return {
            stock: { total: totalProducts, lowStock, outOfStock },
            recentMovements: movementsByType,
        };
    }
}
