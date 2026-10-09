import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { ReturnsRepository } from '../../../domain/repositories/returns/returns.repository.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { CreateReturnDto } from '../../../infrastructure/dtos/returns/create-return.dto';
import { ReturnOrder } from '../../../domain/entities/returns/return-order.entity';
import { ReturnItem } from '../../../domain/entities/returns/return-item.entity';
import { CreateNotificationUseCase } from '../notifications/create-notification.use-case';
import { NotificationPriority } from '../../../domain/entities/notifications/notification.entity';
import { Role } from '@prisma/client';
import { ReturnOutput } from './common/return-output';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class CreateReturnUseCase {
  constructor(
    private readonly returnsRepository: ReturnsRepository,
    private readonly saleRepository: SaleRepository,
    private readonly userRepository: UserRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    dto: CreateReturnDto,
  ): Promise<ReturnOutput> {
    const { returnOrder, sale, output } = this.prisma
      ? await this.prisma.$transaction(
          async (tx) => {
            // Trava pessimista no registro da venda para evitar devoluções concorrentes simultâneas
            await tx.$queryRaw`
              SELECT id FROM sales WHERE id = ${dto.saleId} AND tenant_id = ${tenantId} FOR UPDATE
            `;
            return await this.processReturn(tenantId, userId, dto, tx);
          },
          { timeout: 15000, maxWait: 5000 },
        )
      : await this.processReturn(tenantId, userId, dto);

    // 7. Notifica administradores APÓS o commit da transação de banco de dados
    try {
      await this.notifyAdmins(tenantId, sale, returnOrder);
    } catch {
      // Falha no envio de notificações secundárias não deve abortar o resultado
    }

    return output;
  }

  private async processReturn(
    tenantId: string,
    userId: string,
    dto: CreateReturnDto,
    tx?: any,
  ): Promise<{ returnOrder: ReturnOrder; sale: any; output: ReturnOutput }> {
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

    // 3. Busca devoluções anteriores para garantir que a soma acumulada não exceda a venda
    const existingReturns = await this.returnsRepository.findBySaleId(
      tenantId,
      dto.saleId,
    );
    const activeReturns = (existingReturns ?? []).filter(
      (r) => r.status !== 'REJECTED',
    );

    // 4. Validate items
    const returnItems: ReturnItem[] = [];
    let totalRefund = 0;

    for (const itemDto of dto.items) {
      const saleItem = itemDto.saleItemId
        ? sale.items.find((i) => i.id.toString() === itemDto.saleItemId)
        : sale.items.find((i) => i.productId === itemDto.productId);

      if (!saleItem) {
        throw new BadRequestException(
          `Product ${itemDto.productId} not found in this sale`,
        );
      }

      // Calcula a quantidade já devolvida ou em solicitação para este item
      const alreadyReturnedQty = activeReturns.reduce((sum, ret) => {
        const matchingItems = ret.items.filter((it) =>
          it.saleItemId
            ? it.saleItemId === saleItem.id.toString()
            : it.productId === itemDto.productId,
        );
        return (
          sum + matchingItems.reduce((acc, curr) => acc + curr.quantity, 0)
        );
      }, 0);

      const maxReturnable = saleItem.quantity - alreadyReturnedQty;
      if (itemDto.quantity > maxReturnable) {
        throw new BadRequestException(
          `Quantity for product ${itemDto.productId} exceeds returnable quantity (${maxReturnable} available of ${saleItem.quantity} sold, requested ${itemDto.quantity})`,
        );
      }

      const itemTotal = itemDto.quantity * saleItem.unitPrice;
      totalRefund += itemTotal;

      returnItems.push(
        ReturnItem.create({
          productId: itemDto.productId,
          saleItemId: saleItem.id.toString(),
          quantity: itemDto.quantity,
          unitPrice: saleItem.unitPrice,
          total: itemTotal,
          condition: itemDto.condition,
        }),
      );
    }

    // 5. Create ReturnOrder
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

    await this.returnsRepository.save(returnOrder, tx);

    // 6. Transition sale to RETURN_REQUESTED
    sale.requestReturn();
    await this.saleRepository.update(tenantId, sale, tx);

    const output: ReturnOutput = {
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

    return { returnOrder, sale, output };
  }

  private async notifyAdmins(
    tenantId: string,
    sale: any,
    returnOrder: ReturnOrder,
  ): Promise<void> {
    const users = await this.userRepository.findAllByTenant(tenantId);
    const admins = users.filter(
      (u) => u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN,
    );

    for (const admin of admins) {
      await this.createNotificationUseCase.execute(tenantId, {
        userId: admin.id.toString(),
        type: 'RETURN_PENDING' as any,
        priority: NotificationPriority.HIGH,
        title: 'Nova Solicitação de Devolução',
        message: `Uma nova solicitação de devolução foi criada para a venda #${sale.invoiceNumber ?? sale.id.toString()}.`,
        actionUrl: `/returns/${returnOrder.id.toString()}`,
      });
    }
  }
}
