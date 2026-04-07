import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@common/application/pagination-output';
import { UseCase } from '@common/application/use-case.interface';
import {
  CustomerFilters,
  CustomerRepository,
  CustomerSearchResult,
} from '@domain/repositories/customer-repository';
import { Injectable } from '@nestjs/common';
import { CustomerOutput, CustomerOutputMapper } from './common/customer-output';

export type ListCustomersInput = {
  tenantId: string;
  filters: CustomerFilters;
};
export type ListCustomersOutput = PaginationOutput<CustomerOutput>;

@Injectable()
export class ListCustomersUseCase implements UseCase<
  ListCustomersInput,
  ListCustomersOutput
> {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(input: ListCustomersInput): Promise<ListCustomersOutput> {
    const result = await this.customerRepository.findAll(
      input.tenantId,
      input.filters,
    );
    return this.toOutput(result);
  }

  private toOutput(result: CustomerSearchResult): ListCustomersOutput {
    const customers = result.data.map(CustomerOutputMapper.toOutput);
    return PaginationOutputMapper.toOutput(customers, {
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }
}
