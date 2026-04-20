import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SaleCompletedEvent } from '../../../domain/events/sales/sale-completed.event';
import { StockChangedEvent } from '../../../domain/events/inventory/stock-changed.event';
import { OperationalStreamService } from '../../../infrastructure/services/operational-stream.service';
import { DashboardEventType } from '../../use-cases/dashboard/dashboard-event.types';

@Injectable()
export class DashboardEventsHandler {
  private readonly logger = new Logger(DashboardEventsHandler.name);

  constructor(private readonly operationalStream: OperationalStreamService) {}

  @OnEvent('sale.completed')
  handleSaleCompleted(event: SaleCompletedEvent) {
    const { sale, tenantId } = event;
    
    try {
      this.operationalStream.pushEvent(tenantId, DashboardEventType.SALE_COMPLETED, {
        saleId: sale.id.toString(),
        total: Number(sale.total),
        status: sale.status,
        createdAt: sale.createdAt?.toISOString(),
        customerId: sale.customerId ?? null,
        itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      });
      this.logger.debug(`[DashboardEvent] sale_completed emitted for saleId ${sale.id.toString()}`);
    } catch (err: any) {
      this.logger.error(`Failed to push dashboard.sale_completed event for saleId ${sale.id.toString()}`, err.stack);
    }
  }

  @OnEvent('stock.changed')
  handleStockChanged(event: StockChangedEvent) {
    const { product, adjustment, movementType, tenantId } = event;

    try {
      this.operationalStream.pushEvent(tenantId, DashboardEventType.STOCK_CHANGED, {
        productId: product.id.toString(),
        productName: product.name,
        movementType,
        quantity: Math.abs(adjustment),
        newStockLevel: product.stockQuantity,
        createdAt: event.occurredAt.toISOString(),
      });
      this.logger.debug(`[DashboardEvent] stock_changed emitted for product ${product.id.toString()}`);
    } catch (err: any) {
      this.logger.error(`Failed to push dashboard.stock_changed event for product ${product.id.toString()}`, err.stack);
    }
  }
}
