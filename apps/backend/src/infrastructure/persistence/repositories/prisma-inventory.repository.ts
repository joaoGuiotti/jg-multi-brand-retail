import { InventoryMovement } from '@domain/entities/inventory/inventory-movement.entity';
import {
  InventoryFilters,
  InventoryRepository,
  InventorySearchResult,
} from '@domain/repositories/inventory-repository';
import { Injectable } from '@nestjs/common';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    movement: InventoryMovement,
  ): Promise<InventoryMovement> {
    const data = InventoryMapper.toPersistence(movement);

    const created = await this.prisma.inventoryMovement.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return InventoryMapper.toDomain(created);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryMovement | null> {
    const movement = await this.prisma.inventoryMovement.findFirst({
      where: { id, tenantId },
    });

    if (!movement) return null;

    return InventoryMapper.toDomain(movement);
  }

  async findAll(
    tenantId: string,
    filters: InventoryFilters,
  ): Promise<InventorySearchResult> {
    const { productId, type, userId, startDate, endDate, sortBy, sortOrder } =
      filters;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || ('desc' as const) }
      : { createdAt: 'desc' as const };

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: movements.map(InventoryMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
