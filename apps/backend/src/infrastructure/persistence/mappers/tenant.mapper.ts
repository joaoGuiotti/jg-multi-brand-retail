import { Tenant as PrismaTenant } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Tenant } from '../../../domain/entities/tenants/tenant.entity';

export class TenantMapper {
  static toDomain(raw: PrismaTenant): Tenant {
    return Tenant.create(
      {
        name: raw.name,
        slug: raw.slug,
        logoUrl: raw.logoUrl,
        commissionRate: raw.commissionRate ? Number(raw.commissionRate) : null,
        settings: raw.settings,
        active: raw.active,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(tenant: Tenant) {
    return {
      id: tenant.id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl ?? null,
      commissionRate: tenant.commissionRate
        ? Number(tenant.commissionRate)
        : null,
      settings: tenant.settings ? tenant.settings : undefined,
      active: tenant.active,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
