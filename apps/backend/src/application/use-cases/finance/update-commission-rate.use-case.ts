import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { TenantRepository } from '../../../domain/repositories/tenant-repository';

export type UpdateCommissionRateInput = {
  tenantId: string;
  commissionRate: number | null;
};

@Injectable()
export class UpdateCommissionRateUseCase
  implements UseCase<UpdateCommissionRateInput, any>
{
  constructor(private tenantRepository: TenantRepository) {}

  async execute(input: UpdateCommissionRateInput) {
    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    tenant.updateCommissionRate(input.commissionRate);
    await this.tenantRepository.update(tenant);

    return { success: true, commissionRate: tenant.commissionRate };
  }
}
