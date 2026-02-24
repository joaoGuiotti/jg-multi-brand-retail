import { Tenant as PrismaTenant } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Tenant } from '../../../domain/entities/tenants/tenant.entity';

export class TenantMapper {
    static toDomain(raw: PrismaTenant): Tenant {
        return Tenant.create(
            {
                name: raw.name,
                slug: raw.slug,
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
            settings: tenant.settings,
            active: tenant.active,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
        };
    }
}
