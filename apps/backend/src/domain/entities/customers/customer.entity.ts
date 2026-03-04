import { AggregateRoot } from "@common/domain/aggregate-root";
import { UniqueEntityID } from "@common/domain/unique-entity-id";
import { Address } from "./address.vo";
import { CustomerValidatorFactory } from "./customer.validator";

export interface CustomerProps {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: Address;
    isActive: boolean;
}

export class Customer extends AggregateRoot {
    constructor(props: CustomerProps, id?: UniqueEntityID) {
        super(props, id ?? UniqueEntityID.create());
    }

    static create(props: CustomerProps, id?: UniqueEntityID): Customer {
        const customer = new Customer(props, id);
        customer.validate();
        return customer;
    }

    public get firstName(): string { return this.props.firstName; }
    public get lastName(): string { return this.props.lastName; }
    public get phone(): string { return this.props.phone; }
    public get email(): string { return this.props.email; }
    public get address(): Address { return this.props.address; }
    public get isActive(): boolean { return this.props.isActive; }

    public updateFirstName(firstName: string): void { this.props.firstName = firstName; }

    public updateLastName(lastName: string): void { this.props.lastName = lastName; }

    public updatePhone(phone: string): void { this.props.phone = phone; }

    public updateEmail(email: string): void { this.props.email = email; }

    public updateAddress(address: Address): void { this.props.address = address; }

    public updateIsActive(isActive: boolean): void { this.props.isActive = isActive; }

    public validate(fields?: string[]): void {
        const validator = CustomerValidatorFactory.create();
        validator.validate(this.notification, this, fields);
    }

    public toJSON() {
        return {
            id: this.id.toString(),
            firstName: this.firstName,
            lastName: this.lastName,
            phone: this.phone,
            email: this.email,
            address: this.address,
            isActive: this.isActive,
        };
    }
}