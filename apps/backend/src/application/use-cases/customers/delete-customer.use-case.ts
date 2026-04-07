import { UseCase } from '@common/application/use-case.interface';
import { CustomerRepository } from '@domain/repositories/customer-repository';
import { Injectable, NotFoundException } from '@nestjs/common';

export type DeleteCustomerInput = {
  tenantId: string;
  id: string;
};

@Injectable()
export class DeleteCustomerUseCase implements UseCase<
  DeleteCustomerInput,
  void
> {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(input: DeleteCustomerInput): Promise<void> {
    const { tenantId, id } = input;
    const customer = await this.customerRepository.findById(tenantId, id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    await this.customerRepository.delete(tenantId, id);
  }
}
