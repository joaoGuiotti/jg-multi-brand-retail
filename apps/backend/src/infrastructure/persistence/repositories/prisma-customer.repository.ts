import { Customer } from '@domain/entities/customers/customer.entity';
import {
  CustomerFilters,
  CustomerRepository,
  CustomerSearchResult,
} from '@domain/repositories/customer-repository';
import { Injectable } from '@nestjs/common';
import { CustomerMapper } from '../mappers/customer.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, customer: Customer): Promise<Customer> {
    const data = CustomerMapper.toPersistence(customer);
    const created = await this.prisma.customer.create({
      data: { ...data, tenantId },
    });
    return CustomerMapper.toDomain(created);
  }

  async findById(tenantId: string, id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    if (!customer) return null;
    return CustomerMapper.toDomain(customer);
  }

  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { email, tenantId },
    });
    if (!customer) return null;
    return CustomerMapper.toDomain(customer);
  }

  async findAll(
    tenantId: string,
    filters: CustomerFilters,
  ): Promise<CustomerSearchResult> {
    const { search, isActive, sortBy, sortOrder } = filters;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) where.isActive = isActive;

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || ('asc' as const) }
      : { firstName: 'asc' as const };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map(CustomerMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(tenantId: string, customer: Customer): Promise<Customer> {
    const { id, ...data } = CustomerMapper.toPersistence(customer);
    const updated = await this.prisma.customer.update({
      where: { id, tenantId },
      data,
    });
    return CustomerMapper.toDomain(updated);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.customer.delete({
      where: { id, tenantId },
    });
  }
}
