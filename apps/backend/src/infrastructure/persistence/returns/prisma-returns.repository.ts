import {
  ReturnItem,
  ReturnItemCondition,
} from '@domain/entities/returns/return-item.entity';
import {
  RefundType,
  ReturnOrder,
  ReturnStatus,
} from '@domain/entities/returns/return-order.entity';
import {
  ReturnFilters,
  ReturnSearchResult,
  ReturnsRepository,
} from '@domain/repositories/returns/returns.repository.interface';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaReturnsRepository implements ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(dbRecord: any): ReturnOrder {
    const items = dbRecord.items?.map((item: any) =>
      ReturnItem.create(
        {
          productId: item.productId,
          saleItemId: item.saleItemId ?? item.sale_item_id ?? null,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          condition: item.condition as ReturnItemCondition,
        },
        new UniqueEntityID(item.id),
      ),
    );

    return ReturnOrder.create(
      {
        tenantId: dbRecord.tenantId,
        saleId: dbRecord.saleId,
        userId: dbRecord.userId,
        customerId: dbRecord.customerId,
        status: dbRecord.status as ReturnStatus,
        refundType: dbRecord.refundType as RefundType,
        reason: dbRecord.reason,
        totalRefund: Number(dbRecord.totalRefund),
        approvedBy: dbRecord.approvedBy,
        approvedAt: dbRecord.approvedAt,
        processedAt: dbRecord.processedAt,
        createdAt: dbRecord.createdAt,
        items: items ?? [],
      },
      new UniqueEntityID(dbRecord.id),
    );
  }

  async save(returnOrder: ReturnOrder, tx?: any): Promise<void> {
    const data = {
      tenantId: returnOrder.tenantId,
      saleId: returnOrder.saleId,
      userId: returnOrder.userId,
      customerId: returnOrder.customerId,
      status: returnOrder.status,
      refundType: returnOrder.refundType,
      reason: returnOrder.reason,
      totalRefund: returnOrder.totalRefund,
      approvedBy: returnOrder.approvedBy,
      approvedAt: returnOrder.approvedAt,
      processedAt: returnOrder.processedAt,
      createdAt: returnOrder.createdAt,
    };

    const updateData = { ...data };
    delete (updateData as Record<string, unknown>).tenantId;

    const executeUpsert = async (runner: any) => {
      await runner.returnOrder.upsert({
        where: { id: returnOrder.id.toString() },
        create: {
          id: returnOrder.id.toString(),
          ...data,
          items: {
            create: returnOrder.items.map((item) => ({
              id: item.id.toString(),
              saleItemId: item.saleItemId ?? null,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              condition: item.condition,
            })),
          },
        },
        update: {
          ...updateData,
          items: {
            deleteMany: {},
            create: returnOrder.items.map((item) => ({
              id: item.id.toString(),
              saleItemId: item.saleItemId ?? null,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              condition: item.condition,
            })),
          },
        },
      });
    };

    if (tx) {
      await executeUpsert(tx);
    } else {
      await this.prisma.$transaction(async (innerTx) => {
        await executeUpsert(innerTx);
      });
    }
  }

  async findById(tenantId: string, id: string): Promise<ReturnOrder | null> {
    const record = await this.prisma.returnOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!record) return null;

    return this.mapToEntity(record);
  }

  async findBySaleId(tenantId: string, saleId: string): Promise<ReturnOrder[]> {
    const records = await this.prisma.returnOrder.findMany({
      where: { saleId, tenantId },
      include: { items: true },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async findAll(
    tenantId: string,
    filters: ReturnFilters,
  ): Promise<ReturnSearchResult> {
    const {
      status,
      saleId,
      userId,
      customerId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = filters;

    const where: any = {
      tenantId,
      ...(status && { status }),
      ...(saleId && { saleId }),
      ...(userId && { userId }),
      ...(customerId && { customerId }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.returnOrder.count({ where }),
      this.prisma.returnOrder.findMany({
        where,
        include: { items: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: records.map((record) => this.mapToEntity(record)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
