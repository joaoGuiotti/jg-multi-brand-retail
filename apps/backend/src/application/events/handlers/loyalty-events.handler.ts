import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SaleCompletedEvent } from '../../../domain/events/sales/sale-completed.event';
import { EarnPointsUseCase } from '../../use-cases/loyalty/earn-points.use-case';

@Injectable()
export class LoyaltyEventsHandler {
  private readonly logger = new Logger(LoyaltyEventsHandler.name);

  constructor(private readonly earnPointsUseCase: EarnPointsUseCase) {}

  @OnEvent('sale.completed')
  async handleSaleCompleted(event: SaleCompletedEvent) {
    const { sale, tenantId } = event;
    const customerId = sale.customerId;

    if (!customerId) {
      this.logger.log(
        `Sale ${sale.id.toString()} completed without an identified customer. No loyalty points will be calculated.`,
      );
      return;
    }

    try {
      this.logger.log(
        `Sale ${sale.id.toString()} completed for customer ${customerId}. Computing loyalty points...`,
      );
      await this.earnPointsUseCase.execute({
        tenantId,
        customerId,
        saleId: sale.id.toString(),
        liquidAmount: Number(sale.total),
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to process automatic loyalty points accumulation for sale ${sale.id.toString()}`,
        err.stack,
      );
    }
  }
}
