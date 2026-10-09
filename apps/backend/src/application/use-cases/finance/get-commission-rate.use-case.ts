import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { TenantRepository } from '../../../domain/repositories/tenant-repository';

export type GetCommissionRateInput = {
  tenantId: string;
};

@Injectable()
export class GetCommissionRateUseCase implements UseCase<
  GetCommissionRateInput,
  any
> {
  constructor(private tenantRepository: TenantRepository) {}

  async execute(input: GetCommissionRateInput) {
    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    return { commissionRate: tenant.commissionRate || 0 };
  }
}
