import { Injectable } from '@nestjs/common';
import { ReturnsRepository, ReturnFilters } from '../../../domain/repositories/returns/returns.repository.interface';
import { ReturnOutput } from './common/return-output';
import { PaginationOutput } from '../../../common/application/pagination-output';

@Injectable()
export class ListReturnsUseCase {
  constructor(private readonly returnsRepository: ReturnsRepository) {}

  async execute(tenantId: string, filters: ReturnFilters): Promise<PaginationOutput<ReturnOutput>> {
    const result = await this.returnsRepository.findAll(tenantId, filters);

    return {
      data: result.data.map((order) => ({
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
      })),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}
