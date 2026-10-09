import {
  NotificationPriority,
  NotificationType,
} from '@domain/entities/notifications/notification.entity';
import { ReturnsRepository } from '@domain/repositories/returns/returns.repository.interface';
import { SaleRepository } from '@domain/repositories/sale-repository';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { EarnPointsUseCase } from '../loyalty/earn-points.use-case';
import { CreateNotificationUseCase } from '../notifications/create-notification.use-case';
import { ReturnOutput } from './common/return-output';

@Injectable()
export class ProcessRefundUseCase {
  private readonly logger = new Logger(ProcessRefundUseCase.name);

  constructor(
    private readonly returnsRepository: ReturnsRepository,
    private readonly saleRepository: SaleRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly earnPointsUseCase: EarnPointsUseCase,
    @Optional() private readonly prisma?: PrismaService,
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

      // Reverter pontos se houver cliente associado
      if (sale.customerId) {
        try {
          await this.earnPointsUseCase.reversePoints(
            tenantId,
            sale.customerId,
            sale.id.toString(),
          );
        } catch (error) {
          this.logger.error(
            `Failed to reverse loyalty points for sale ${sale.id.toString()} of customer ${sale.customerId}:`,
            error,
          );
        }
      }
    }

    // Se houver valor reembolsado, registrar saída financeira (PAYABLE / PAID se CASH_REFUND)
    if (this.prisma && order.totalRefund > 0) {
      try {
        const isCashRefund = order.refundType === 'CASH_REFUND';
        await this.prisma.financialAccount.create({
          data: {
            tenantId,
            type: 'PAYABLE',
            description: `Reembolso de Devolução #${order.id.toString().substring(0, 8)} (${order.refundType === 'STORE_CREDIT' ? 'Crédito em Loja' : 'Reembolso em Dinheiro'} - Venda #${sale?.invoiceNumber || order.saleId})`,
            amount: order.totalRefund,
            dueDate: new Date(),
            paidAt: isCashRefund ? new Date() : null,
            status: isCashRefund ? 'PAID' : 'PENDING',
            category: 'REFUND',
            saleId: order.saleId,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to create financial account outflow for return ${order.id.toString()}:`,
          error,
        );
      }
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
