import { Tenant } from '@domain/entities/tenants/tenant.entity';
import { TenantRepository } from '@domain/repositories/tenant-repository';
import { Injectable } from '@nestjs/common';
import { TenantMapper } from '../mappers/tenant.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
    constructor(private prisma: PrismaService) { }

    async create(tenant: Tenant): Promise<Tenant> {
        const data = TenantMapper.toPersistence(tenant);
        const created = await this.prisma.tenant.create({ data });
        return TenantMapper.toDomain(created);
    }

    async findById(id: string): Promise<Tenant | null> {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        return tenant ? TenantMapper.toDomain(tenant) : null;
    }

    async findBySlug(slug: string): Promise<Tenant | null> {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
        return tenant ? TenantMapper.toDomain(tenant) : null;
    }

    async update(tenant: Tenant): Promise<Tenant> {
        const data = TenantMapper.toPersistence(tenant);
        const updated = await this.prisma.tenant.update({
            where: { id: tenant.id.toString() },
            data,
        });
        return TenantMapper.toDomain(updated);
    }
}
