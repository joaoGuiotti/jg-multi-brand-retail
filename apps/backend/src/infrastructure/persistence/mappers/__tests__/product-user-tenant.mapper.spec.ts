import { Product } from '../../../../domain/entities/products/product.entity';
import { Tenant } from '../../../../domain/entities/tenants/tenant.entity';
import { User } from '../../../../domain/entities/users/user.entity';
import { ProductMapper } from '../product.mapper';
import { TenantMapper } from '../tenant.mapper';
import { UserMapper } from '../user.mapper';

// ------------------- ProductMapper tests -------------------

const makeRawProduct = (overrides: any = {}) => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    tenantId: 'tenant-1',
    name: 'Widget',
    description: null,
    sku: 'WG-001',
    barcode: null,
    categoryId: null,
    brandId: null,
    supplierId: null,
    costPrice: { valueOf: () => 10, toString: () => '10' } as any,
    salePrice: { valueOf: () => 20, toString: () => '20' } as any,
    margin: { valueOf: () => 100, toString: () => '100' } as any,
    stockQuantity: 5,
    unit: 'UN',
    active: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

describe('ProductMapper', () => {
    it('toDomain should create a Product entity from raw Prisma data', () => {
        const raw = makeRawProduct();
        const product = ProductMapper.toDomain(raw);
        expect(product).toBeInstanceOf(Product);
        expect(product.id.toString()).toBe(raw.id);
        expect(product.sku).toBe('WG-001');
        expect(product.tenantId).toBe('tenant-1');
    });

    it('toPersistence should convert a Product entity to a plain Prisma-compatible object', () => {
        const product = Product.create({
            tenantId: 'tenant-1', name: 'Widget', sku: 'WG-001', costPrice: 10, salePrice: 20,
            margin: 100, stockQuantity: 5, unit: 'UN', active: true,
        });
        const raw = ProductMapper.toPersistence(product);
        expect(raw.id).toBe(product.id.toString());
        expect(raw.sku).toBe('WG-001');
        expect(raw.tenantId).toBe('tenant-1');
    });
});

// ------------------- UserMapper tests -------------------

const makeRawUser = (overrides: any = {}) => ({
    id: '550e8400-e29b-41d4-a716-446655440001',
    tenantId: 'tenant-1',
    email: 'a@b.com',
    passwordHash: 'hash',
    role: 'USER' as const,
    name: 'Alice',
    active: true,
    twoFaSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

describe('UserMapper', () => {
    it('toDomain should create a User entity from raw Prisma data', () => {
        const raw = makeRawUser();
        const user = UserMapper.toDomain(raw);
        expect(user).toBeInstanceOf(User);
        expect(user.id.toString()).toBe(raw.id);
        expect(user.email).toBe('a@b.com');
    });

    it('toPersistence should convert a User entity to a plain object', () => {
        const user = User.create({ tenantId: 'tenant-1', email: 'a@b.com', passwordHash: 'h', role: 'USER', name: 'Alice', active: true });
        const raw = UserMapper.toPersistence(user);
        expect(raw.id).toBe(user.id.toString());
        expect(raw.email).toBe('a@b.com');
    });
});

// ------------------- TenantMapper tests -------------------

const makeRawTenant = (overrides: any = {}) => ({
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Acme',
    slug: 'acme',
    settings: { currency: 'BRL' },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

describe('TenantMapper', () => {
    it('toDomain should create a Tenant entity from raw Prisma data', () => {
        const raw = makeRawTenant();
        const tenant = TenantMapper.toDomain(raw);
        expect(tenant).toBeInstanceOf(Tenant);
        expect(tenant.id.toString()).toBe(raw.id);
        expect(tenant.slug).toBe('acme');
    });

    it('toPersistence should convert a Tenant entity to a plain object', () => {
        const tenant = Tenant.create({ name: 'Acme', slug: 'acme', active: true });
        const raw = TenantMapper.toPersistence(tenant);
        expect(raw.id).toBe(tenant.id.toString());
        expect(raw.slug).toBe('acme');
    });
});
