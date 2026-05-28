import { NotFoundException } from '@nestjs/common';
import { Tenant } from '../../../domain/entities/tenants/tenant.entity';
import { GetPublicTenantUseCase } from './get-public-tenant.use-case';

const makeTenant = (overrides: any = {}) =>
  Tenant.create({ name: 'Acme', slug: 'acme', active: true, ...overrides });

describe('GetPublicTenantUseCase', () => {
  let useCase: GetPublicTenantUseCase;
  let tenantRepository: any;

  beforeEach(() => {
    tenantRepository = { findBySlug: jest.fn() };
    useCase = new GetPublicTenantUseCase(tenantRepository);
  });

  it('should throw NotFoundException if tenant not found by slug', async () => {
    tenantRepository.findBySlug.mockResolvedValue(null);
    await expect(
      useCase.execute({ slug: 'invalid-slug' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return public details of tenant with custom colors from settings', async () => {
    const tenant = makeTenant({
      settings: {
        theme: {
          primaryColor: '#ffffff',
          accentColor: '#000000',
        },
      },
    });
    tenantRepository.findBySlug.mockResolvedValue(tenant);

    const result = await useCase.execute({ slug: 'acme' });
    expect(result.id).toBe(tenant.id.toString());
    expect(result.name).toBe('Acme');
    expect(result.active).toBe(true);
    expect(result.theme.primaryColor).toBe('#ffffff');
    expect(result.theme.accentColor).toBe('#000000');
  });

  it('should fallback to default blue colors if settings/theme is missing', async () => {
    const tenant = makeTenant({ settings: null });
    tenantRepository.findBySlug.mockResolvedValue(tenant);

    const result = await useCase.execute({ slug: 'acme' });
    expect(result.theme.primaryColor).toBe('#3b82f6');
    expect(result.theme.accentColor).toBe('#1d4ed8');
  });
});
