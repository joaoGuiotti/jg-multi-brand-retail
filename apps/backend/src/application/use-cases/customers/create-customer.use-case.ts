import { UseCase } from '@common/application/use-case.interface';
import { Address } from '@domain/entities/customers/address.vo';
import { Customer } from '@domain/entities/customers/customer.entity';
import { CustomerRepository } from '@domain/repositories/customer-repository';
import { ConflictException, Injectable } from '@nestjs/common';
import { CustomerOutput, CustomerOutputMapper } from './common/customer-output';

export type CreateCustomerInput = {
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    document: string;
    isActive?: boolean;
    address: {
        street: string;
        number: string;
        complement?: string;
        city: string;
        state: string;
        zipCode: string;
    };
};

@Injectable()
export class CreateCustomerUseCase implements UseCase<CreateCustomerInput, CustomerOutput> {
    constructor(private customerRepository: CustomerRepository) { }

    async execute(input: CreateCustomerInput): Promise<CustomerOutput> {
        const { tenantId, address, ...rest } = input;

        const existing = await this.customerRepository.findByEmail(tenantId, rest.email);
        if (existing) {
            throw new ConflictException('Customer with this email already exists');
        }

        const customer = Customer.create({
            ...rest,
            isActive: rest.isActive ?? true,
            address: Address.create(address),
        });

        const created = await this.customerRepository.create(tenantId, customer);
        return CustomerOutputMapper.toOutput(created);
    }
}
