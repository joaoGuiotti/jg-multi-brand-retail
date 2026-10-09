import { AggregateRoot } from '@common/domain/aggregate-root';
import { UniqueEntityID } from '@common/domain/unique-entity-id';
import { normalizeDocument } from '@domain/shared/brazilian-document';
import { Address } from './address.vo';
import { CustomerValidatorFactory } from './customer.validator';

export interface CustomerProps {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: Address;
  isActive: boolean;
  /** CPF/CNPJ somente dígitos, ou null/undefined quando o cliente não tem documento. */
  document?: string | null;
}

export class Customer extends AggregateRoot<CustomerProps> {
  constructor(props: CustomerProps, id?: UniqueEntityID) {
    const rawDoc = props.document;
    const doc =
      rawDoc === '' || rawDoc === null || rawDoc === undefined ? null : rawDoc;
    super({ ...props, document: doc }, id ?? UniqueEntityID.create());
  }

  static create(props: CustomerProps, id?: UniqueEntityID): Customer {
    const customer = new Customer(props, id);
    customer.validate();
    if (!customer.notification.hasErrors() && customer.props.document) {
      customer.props.document = normalizeDocument(customer.props.document);
    }
    return customer;
  }

  public get firstName(): string {
    return this.props.firstName;
  }
  public get lastName(): string {
    return this.props.lastName;
  }
  public get phone(): string {
    return this.props.phone;
  }
  public get email(): string {
    return this.props.email;
  }
  public get address(): Address {
    return this.props.address;
  }
  public get isActive(): boolean {
    return this.props.isActive;
  }
  public get document(): string | null {
    return this.props.document ?? null;
  }

  public updateFirstName(firstName: string): void {
    this.props.firstName = firstName;
    this.validate(['firstName']);
  }

  public updateLastName(lastName: string): void {
    this.props.lastName = lastName;
    this.validate(['lastName']);
  }

  public updatePhone(phone: string): void {
    this.props.phone = phone;
    this.validate(['phone']);
  }

  public updateEmail(email: string): void {
    this.props.email = email;
    this.validate(['email']);
  }

  public updateAddress(address: Address): void {
    this.props.address = address;
    this.validate(['address']);
  }

  public updateIsActive(isActive: boolean): void {
    this.props.isActive = isActive;
    this.validate(['isActive']);
  }

  public updateDocument(document: string | null): void {
    const doc =
      document === '' || document === null || document === undefined
        ? null
        : document;
    this.props.document = doc;
    this.validate(['document']);
    if (!this.notification.hasErrors() && doc) {
      this.props.document = normalizeDocument(doc);
    }
  }

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
      document: this.document,
      address: this.address,
      isActive: this.isActive,
    };
  }
}
