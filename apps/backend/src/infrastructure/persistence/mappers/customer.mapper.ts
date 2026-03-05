import { UniqueEntityID } from '@common/domain/unique-entity-id';
import { Address } from '@domain/entities/customers/address.vo';
import { Customer } from '@domain/entities/customers/customer.entity';
import { Customer as PrismaCustomer } from '@prisma/client';

export class CustomerMapper {
    /**
     * Maps a Prisma Customer record to a domain Customer entity.
     * tenantId is NOT mapped into the entity — it belongs to infrastructure.
     */
    static toDomain(raw: PrismaCustomer): Customer {
        return Customer.create(
            {
                firstName: raw.firstName,
                lastName: raw.lastName,
                email: raw.email,
                phone: raw.phone,
                isActive: raw.isActive,
                document: raw.document,
                address: Address.create({
                    street: raw.street,
                    number: raw.number,
                    complement: raw.complement ?? undefined,
                    city: raw.city,
                    state: raw.state,
                    zipCode: raw.zipCode,
                }),
            },
            new UniqueEntityID(raw.id),
        );
    }

    /**
     * Maps a domain Customer entity to a Prisma-compatible plain object.
     * tenantId is NOT included — the repository adds it separately.
     */
    static toPersistence(customer: Customer) {
        return {
            id: customer.id.toString(),
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            document: customer.document,
            isActive: customer.isActive,
            street: customer.address.street,
            number: customer.address.number,
            complement: customer.address.complement ?? null,
            city: customer.address.city,
            state: customer.address.state,
            zipCode: customer.address.zipCode,
        };
    }
}
