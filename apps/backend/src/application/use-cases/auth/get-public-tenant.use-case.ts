import { UseCase } from '@common/application/use-case.interface';
import { TenantRepository } from '@domain/repositories/tenant-repository';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PublicTenantOutput } from '@infrastructure/dtos/auth/public-tenant-output.dto';

export type GetPublicTenantInput = {
  slug: string;
};

@Injectable()
export class GetPublicTenantUseCase implements UseCase<
  GetPublicTenantInput,
  PublicTenantOutput
> {
  private readonly logger = new Logger(GetPublicTenantUseCase.name);

  constructor(private tenantRepository: TenantRepository) {}

  async execute(input: GetPublicTenantInput): Promise<PublicTenantOutput> {
    const tenant = await this.tenantRepository.findBySlug(input.slug);

    if (!tenant) {
      this.logger.warn(
        `Tenant resolution failed: slug '${input.slug}' not found`,
      );
      throw new NotFoundException(`Tenant with slug '${input.slug}' not found`);
    }

    this.logger.log(
      `Tenant resolved successfully: slug '${input.slug}' (active: ${tenant.active})`,
    );

    const settings = tenant.settings || {};
    const theme = settings.theme || {};

    return {
      id: tenant.id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl || null,
      active: tenant.active,
      theme: {
        primaryColor: theme.primaryColor || '#3b82f6', // Default Blue-500
        accentColor: theme.accentColor || '#1d4ed8', // Default Blue-700
      },
    };
  }
}
