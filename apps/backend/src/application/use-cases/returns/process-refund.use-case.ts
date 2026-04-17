import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReturnsRepository } from '../../../domain/repositories/returns/returns.repository.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { ReturnOutput } from './common/return-output';
import { CreateNotificationUseCase } from '../notifications/create-notification.use-case';
import { NotificationType, NotificationPriority } from '../../../domain/entities/notifications/notification.entity';

@Injectable()
export class ProcessRefundUseCase {
  constructor(
    private readonly returnsRepository: ReturnsRepository,
    private readonly saleRepository: SaleRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(tenantId: string, id: string): Promise<ReturnOutput> {
    const order = await this.returnsRepository.findById(tenantId, id);

    if (!order) {
      throw new NotFoundException('Return order not found');
    }

    if (order.status !== 'APPROVED') {
      throw new BadRequestException(
        `Must be approved before processing refund. Current: ${order.status}`,
      );
    }

    // Transition ReturnOrder to REFUNDED
    order.processRefund();
    await this.returnsRepository.save(order);

    // Transition Sale to RETURNED
    const sale = await this.saleRepository.findById(tenantId, order.saleId);
    if (sale) {
      sale.completeReturn();
      await this.saleRepository.update(tenantId, sale);
    }

    // Notify requesting user
    await this.createNotificationUseCase.execute(tenantId, {
      userId: order.userId,
      type: NotificationType.RETURN_REFUNDED,
      priority: NotificationPriority.HIGH,
      title: 'Reembolso Processado',
      message: `O reembolso para a solicitação de devolução #${order.id.toString().substring(0, 8)} foi processado com sucesso.`,
      actionUrl: `/returns`,
    });

    return {
      id: order.id.toString(),
      tenantId: order.tenantId,
      saleId: order.saleId,
      userId: order.userId,
      customerId: order.customerId ?? null,
      status: order.status,
      refundType: order.refundType,
      reason: order.reason ?? null,
      totalRefund: order.totalRefund,
      approvedBy: order.approvedBy ?? null,
      approvedAt: order.approvedAt ?? null,
      processedAt: order.processedAt ?? null,
      createdAt: order.createdAt ?? new Date(),
      items: order.items.map((item) => ({
        id: item.id.toString(),
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        condition: item.condition,
      })),
    };
  }
}
