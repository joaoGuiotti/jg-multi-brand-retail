import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReturnsRepository } from '../../../domain/repositories/returns/returns.repository.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { ApproveReturnDto } from '../../../infrastructure/dtos/returns/approve-return.dto';
import { ReturnOutput } from './common/return-output';
import { CreateNotificationUseCase } from '../notifications/create-notification.use-case';
import { NotificationType, NotificationPriority } from '../../../domain/entities/notifications/notification.entity';

@Injectable()
export class UpdateReturnStatusUseCase {
  constructor(
    private readonly returnsRepository: ReturnsRepository,
    private readonly saleRepository: SaleRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    id: string,
    dto: ApproveReturnDto,
  ): Promise<ReturnOutput> {
    const order = await this.returnsRepository.findById(tenantId, id);

    if (!order) {
      throw new NotFoundException('Return order not found');
    }

    if (order.status !== 'REQUESTED') {
      throw new BadRequestException(`Cannot update status from ${order.status}`);
    }

    if (dto.status !== 'APPROVED' && dto.status !== 'REJECTED') {
      throw new BadRequestException('Use process-refund for completing the return');
    }

    if (dto.status === 'APPROVED') {
      order.approve(userId);
    } else if (dto.status === 'REJECTED') {
      order.reject(userId, dto.reason);

      // Revert the sale back to COMPLETED so the customer can retry
      const sale = await this.saleRepository.findById(tenantId, order.saleId);
      if (sale) {
        sale.rejectReturn();
        await this.saleRepository.update(tenantId, sale);
      }
    }

    await this.returnsRepository.save(order);

    // Notify requesting user
    await this.createNotificationUseCase.execute(tenantId, {
      userId: order.userId,
      type: dto.status === 'APPROVED' ? NotificationType.RETURN_APPROVED : NotificationType.RETURN_REJECTED,
      priority: NotificationPriority.MEDIUM,
      title: dto.status === 'APPROVED' ? 'Devolução Aprovada' : 'Devolução Reprovada',
      message:
        dto.status === 'APPROVED'
          ? `Sua solicitação de devolução para a venda #${order.saleId.substring(0, 8)} foi aprovada.`
          : `Sua solicitação de devolução para a venda #${order.saleId.substring(0, 8)} foi reprovada. ${dto.reason ? `Motivo: ${dto.reason}` : ''}`,
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
