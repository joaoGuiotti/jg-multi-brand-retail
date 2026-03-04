import { Customer } from '@domain/entities/customers/customer.entity';

export type AddressOutput = {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
};

export type CustomerOutput = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    address: AddressOutput;
};

export class CustomerOutputMapper {
    static toOutput(entity: Customer): CustomerOutput {
        return {
            id: entity.id.toString(),
            firstName: entity.firstName,
            lastName: entity.lastName,
            email: entity.email,
            phone: entity.phone,
            isActive: entity.isActive,
            address: {
                street: entity.address.street,
                number: entity.address.number,
                complement: entity.address.complement,
                city: entity.address.city,
                state: entity.address.state,
                zipCode: entity.address.zipCode,
            },
        };
    }
}
