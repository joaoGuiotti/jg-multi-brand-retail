import { ValueObject } from "@common/domain/value-object";

export interface AddressProps {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
}

export class Address extends ValueObject {
    private props: AddressProps;

    constructor(props: AddressProps) {
        super();
        this.props = props;
    }

    static create(props: AddressProps): Address {
        return new Address(props);
    }

    public get street(): string { return this.props.street; }
    public get number(): string { return this.props.number; }
    public get complement(): string | undefined { return this.props.complement; }
    public get city(): string { return this.props.city; }
    public get state(): string { return this.props.state; }
    public get zipCode(): string { return this.props.zipCode; }
}