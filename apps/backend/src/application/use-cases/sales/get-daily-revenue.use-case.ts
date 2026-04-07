import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';

@Injectable()
export class GetDailyRevenueUseCase implements UseCase<
  GetDailyRevenueInput,
  GetDailyRevenueOutput
> {
  constructor(private saleRepository: SaleRepository) {}

  async execute(input: GetDailyRevenueInput): Promise<GetDailyRevenueOutput> {
    const days = input.days || 7;
    const data = await this.saleRepository.getDailyRevenue(
      input.tenantId,
      days,
    );
    return data;
  }
}

export type GetDailyRevenueInput = {
  tenantId: string;
  days?: number;
};

export type GetDailyRevenueOutput = {
  date: string;
  revenue: number;
}[];
