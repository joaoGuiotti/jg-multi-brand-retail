import { Tenant } from '../entities/tenants/tenant.entity';

export abstract class TenantRepository {
    abstract create(tenant: Tenant): Promise<Tenant>;
    abstract findById(id: string): Promise<Tenant | null>;
    abstract findBySlug(slug: string): Promise<Tenant | null>;
    abstract update(tenant: Tenant): Promise<Tenant>;
}
