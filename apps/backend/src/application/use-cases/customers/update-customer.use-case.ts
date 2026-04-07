import { UseCase } from '@common/application/use-case.interface';
import { Address } from '@domain/entities/customers/address.vo';
import { CustomerRepository } from '@domain/repositories/customer-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerOutput, CustomerOutputMapper } from './common/customer-output';

export type UpdateCustomerInput = {
  tenantId: string;
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  document?: string;
  isActive?: boolean;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
  };
};

@Injectable()
export class UpdateCustomerUseCase implements UseCase<
  UpdateCustomerInput,
  CustomerOutput
> {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(input: UpdateCustomerInput): Promise<CustomerOutput> {
    const { tenantId, id, address, ...rest } = input;

    const customer = await this.customerRepository.findById(tenantId, id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (rest.firstName !== undefined) customer.updateFirstName(rest.firstName);
    if (rest.lastName !== undefined) customer.updateLastName(rest.lastName);
    if (rest.email !== undefined) customer.updateEmail(rest.email);
    if (rest.phone !== undefined) customer.updatePhone(rest.phone);
    if (rest.document !== undefined) customer.updateDocument(rest.document);
    if (rest.isActive !== undefined) customer.updateIsActive(rest.isActive);
    if (address !== undefined) customer.updateAddress(Address.create(address));

    const updated = await this.customerRepository.update(tenantId, customer);
    return CustomerOutputMapper.toOutput(updated);
  }
}
