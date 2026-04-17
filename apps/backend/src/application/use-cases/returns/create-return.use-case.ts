import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReturnsRepository } from '../../../domain/repositories/returns/returns.repository.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { CreateReturnDto } from '../../../infrastructure/dtos/returns/create-return.dto';
import { ReturnOrder } from '../../../domain/entities/returns/return-order.entity';
import { ReturnItem } from '../../../domain/entities/returns/return-item.entity';
import { CreateNotificationUseCase } from '../notifications/create-notification.use-case';
import { NotificationType, NotificationPriority } from '../../../domain/entities/notifications/notification.entity';
import { Role } from '@prisma/client';
import { ReturnOutput } from './common/return-output';

@Injectable()
export class CreateReturnUseCase {
  constructor(
    private readonly returnsRepository: ReturnsRepository,
    private readonly saleRepository: SaleRepository,
    private readonly userRepository: UserRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(tenantId: string, userId: string, dto: CreateReturnDto): Promise<ReturnOutput> {
    // 1. Verify sale exists and belongs to tenant
    const sale = await this.saleRepository.findById(tenantId, dto.saleId);
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // 2. Only COMPLETED sales can initiate a return.
    //    RETURN_REQUESTED means a return is already in progress.
    //    RETURNED means it has been fully processed.
    if (sale.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Cannot initiate a return for a sale with status: ${sale.status}`,
      );
    }

    // 3. Validate items
    const returnItems: ReturnItem[] = [];
    let totalRefund = 0;

    for (const itemDto of dto.items) {
      const saleItem = sale.items.find((i) => i.productId === itemDto.productId);
      if (!saleItem) {
        throw new BadRequestException(`Product ${itemDto.productId} not found in this sale`);
      }

      if (itemDto.quantity > saleItem.quantity) {
        throw new BadRequestException(`Quantity for product ${itemDto.productId} exceeds sale quantity`);
      }

      const itemTotal = itemDto.quantity * saleItem.unitPrice;
      totalRefund += itemTotal;

      returnItems.push(
        ReturnItem.create({
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          unitPrice: saleItem.unitPrice,
          total: itemTotal,
          condition: itemDto.condition,
        }),
      );
    }

    // 4. Create ReturnOrder
    const returnOrder = ReturnOrder.create({
      tenantId,
      saleId: dto.saleId,
      userId,
      customerId: sale.customerId,
      status: 'REQUESTED',
      refundType: dto.refundType,
      reason: dto.reason,
      totalRefund,
      items: returnItems,
    });

    await this.returnsRepository.save(returnOrder);

    // 5. Transition sale to RETURN_REQUESTED
    sale.requestReturn();
    await this.saleRepository.update(tenantId, sale);

    // 6. Notify ADMINs
    const users = await this.userRepository.findAllByTenant(tenantId);
    const admins = users.filter((u) => u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN);

    for (const admin of admins) {
      await this.createNotificationUseCase.execute(tenantId, {
        userId: admin.id.toString(),
        type: 'RETURN_PENDING' as any,
        priority: NotificationPriority.HIGH,
        title: 'Nova Solicitação de Devolução',
        message: `Uma nova solicitação de devolução foi criada para a venda #${sale.invoiceNumber ?? sale.id}.`,
        actionUrl: `/returns/${returnOrder.id.toString()}`,
      });
    }

    return {
      id: returnOrder.id.toString(),
      tenantId: returnOrder.tenantId,
      saleId: returnOrder.saleId,
      userId: returnOrder.userId,
      customerId: returnOrder.customerId ?? null,
      status: returnOrder.status,
      refundType: returnOrder.refundType,
      reason: returnOrder.reason ?? null,
      totalRefund: returnOrder.totalRefund,
      approvedBy: returnOrder.approvedBy ?? null,
      approvedAt: returnOrder.approvedAt ?? null,
      processedAt: returnOrder.processedAt ?? null,
      createdAt: returnOrder.createdAt ?? new Date(),
      items: returnOrder.items.map((item) => ({
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
