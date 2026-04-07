import { UseCase } from '@common/application/use-case.interface';
import { CustomerRepository } from '@domain/repositories/customer-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerOutput, CustomerOutputMapper } from './common/customer-output';

export type GetCustomerInput = {
  tenantId: string;
  id: string;
};

@Injectable()
export class GetCustomerUseCase implements UseCase<
  GetCustomerInput,
  CustomerOutput
> {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(input: GetCustomerInput): Promise<CustomerOutput> {
    const customer = await this.customerRepository.findById(
      input.tenantId,
      input.id,
    );
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return CustomerOutputMapper.toOutput(customer);
  }
}
