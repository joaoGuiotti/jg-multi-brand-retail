import { Injectable, NotFoundException } from '@nestjs/common';
import { ReturnsRepository } from '../../../domain/repositories/returns/returns.repository.interface';
import { ReturnOutput } from './common/return-output';

@Injectable()
export class GetReturnUseCase {
  constructor(private readonly returnsRepository: ReturnsRepository) {}

  async execute(tenantId: string, id: string): Promise<ReturnOutput> {
    const order = await this.returnsRepository.findById(tenantId, id);

    if (!order) {
      throw new NotFoundException('Return order not found');
    }

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
