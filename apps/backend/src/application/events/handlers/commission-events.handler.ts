import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SaleCompletedEvent } from '../../../domain/events/sales/sale-completed.event';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class CommissionEventsHandler {
  private readonly logger = new Logger(CommissionEventsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('sale.completed', { async: true })
  async handleSaleCompletedEvent(event: SaleCompletedEvent) {
    try {
      this.logger.log(`Calculating commission for sale ${event.sale.id.toString()}`);

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: event.tenantId },
        select: { commissionRate: true },
      });

      if (!tenant || !tenant.commissionRate) {
        this.logger.debug(
          `Tenant ${event.tenantId} has no commission rate configured. Skipping commission for sale ${event.sale.id.toString()}`,
        );
        return;
      }

      const commissionRate = Number(tenant.commissionRate);
      if (commissionRate <= 0) return;

      const sale = event.sale;
      
      const baseAmount = Number(sale.total);
      
      const commissionAmount = (baseAmount * commissionRate) / 100;

      await this.prisma.commissionTransaction.create({
        data: {
          tenantId: event.tenantId,
          userId: sale.userId,
          saleId: sale.id.toString(),
          baseAmount,
          percentageApplied: commissionRate,
          commissionAmount,
          status: 'PENDING',
        },
      });

      this.logger.log(`Commission of R$ ${commissionAmount} generated for sale ${event.sale.id.toString()}`);
    } catch (error) {
      this.logger.error(`Error calculating commission: ${(error as any).message}`, (error as any).stack);
    }
  }
}
