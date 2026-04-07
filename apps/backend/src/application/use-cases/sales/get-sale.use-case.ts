import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { SaleOutput, SaleOutputMapper } from './common/sale-output';

export type GetSaleInput = { tenantId: string; id: string };

@Injectable()
export class GetSaleUseCase implements UseCase<GetSaleInput, SaleOutput> {
  constructor(private saleRepository: SaleRepository) {}

  async execute(input: GetSaleInput): Promise<SaleOutput> {
    const sale = await this.saleRepository.findById(input.tenantId, input.id);

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return SaleOutputMapper.toOutput(sale, input.tenantId);
  }
}
