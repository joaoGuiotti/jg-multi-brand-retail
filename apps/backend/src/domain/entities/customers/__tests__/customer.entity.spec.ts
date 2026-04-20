import { UniqueEntityID } from '@common/domain/unique-entity-id';
import { Address } from '../address.vo';
import { Customer } from '../customer.entity';

const createCustomer = () => {
  return Customer.create({
    firstName: 'John',
    lastName: 'Doe',
    phone: '123456789',
    email: 'john.doe@example.com',
    address: Address.create({
      street: '123 Main St',
      number: '123',
      complement: 'Apto 1',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '00000-000',
    }),
    document: '12345678901',
    isActive: true,
  });
};

describe('Customer Entity', () => {
  beforeEach(() => {
    Customer.prototype.validate = jest
      .fn()
      .mockImplementation(Customer.prototype.validate);
  });

  it('constructor of customer', () => {
    const customer = Customer.create({
      firstName: 'John',
      lastName: 'Doe',
      phone: '123456789',
      email: 'john.doe@example.com',
      document: '123456789',
      address: Address.create({
        street: '123 Main St',
        number: '123',
        complement: 'Apto 1',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '00000-000',
      }),
      isActive: true,
    });
    expect(customer).toBeDefined();
  });

  describe('id field', () => {
    const actor = Customer.create({
      firstName: 'John',
      lastName: 'Doe',
      phone: '123456789',
      email: 'john.doe@example.com',
      document: '123456789',
      address: Address.create({
        street: '123 Main St',
        number: '123',
        complement: 'Apto 1',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '00000-000',
      }),
      isActive: true,
    });
    const arrangeIds = [
      { id: null },
      { id: undefined },
      { id: new UniqueEntityID() },
    ];

    test.each(arrangeIds)('when id is %j', (item) => {
      const castMember = new Customer(actor.props, item.id!);
      expect(castMember.id).toBeInstanceOf(UniqueEntityID);
    });
  });

  describe('Customer create command', () => {
    const arrange = [
      {
        firstName: 'John',
        lastName: 'Doe',
        phone: '123456789',
        email: 'john.doe@example.com',
        document: '12345678901',
        address: Address.create({
          street: '123 Main St',
          number: '123',
          complement: 'Apto 1',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '00000-000',
        }),
        isActive: true,
      },
    ];

    test.each(arrange)('when props is %j', (item) => {
      const customer = Customer.create(item);
      expect(customer).toBeDefined();
      expect(customer.id).toBeInstanceOf(UniqueEntityID);
      expect(customer.props).toEqual(item);
      expect(customer.props.firstName).toBe(item.firstName);
      expect(customer.props.lastName).toBe(item.lastName);
      expect(customer.props.phone).toBe(item.phone);
      expect(customer.props.email).toBe(item.email);
      expect(customer.props.address).toBe(item.address);
      expect(customer.props.isActive).toBe(item.isActive);
      expect(customer.notification.hasErrors()).toBe(false);
    });
  });

  describe('Customer update commands', () => {
    it('Should update firstName', () => {
      const customer = createCustomer();
      customer.updateFirstName('Jane');
      expect(customer.props.firstName).toBe('Jane');
    });

    it('Should update lastName', () => {
      const customer = createCustomer();
      customer.updateLastName('Doe');
      expect(customer.props.lastName).toBe('Doe');
    });

    it('Should update phone', () => {
      const customer = createCustomer();
      customer.updatePhone('123456789');
      expect(customer.props.phone).toBe('123456789');
    });

    it('Should update email', () => {
      const customer = createCustomer();
      customer.updateEmail('john.doe@example.com');
      expect(customer.props.email).toBe('john.doe@example.com');
    });

    it('Should update address', () => {
      const customer = createCustomer();
      customer.updateAddress(
        Address.create({
          street: '123 Main St',
          number: '123',
          complement: 'Apto 1',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '00000-000',
        }),
      );
      expect(customer.props.address).toEqual(
        Address.create({
          street: '123 Main St',
          number: '123',
          complement: 'Apto 1',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '00000-000',
        }),
      );
    });

    it('Should update isActive', () => {
      const customer = createCustomer();
      customer.updateIsActive(true);
      expect(customer.props.isActive).toBe(true);
    });
  });

  describe('Customer validation', () => {
    it('Should validate customer', () => {
      const customer = createCustomer();
      customer.validate();
      expect(customer.notification.hasErrors()).toBe(false);
    });

    it('Should validate customer with invalid fields', () => {
      const longString = 'a'.repeat(101);
      const customer = Customer.create({
        firstName: longString,
        lastName: longString,
        phone: longString,
        email: longString,
        document: longString,
        address: Address.create({
          street: '123 Main St',
          number: '123',
          complement: 'Apto 1',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '00000-000',
        }),
        isActive: true,
      });
      customer.validate();
      expect(customer.notification.hasErrors()).toBe(true);
      expect(customer.notification.messages()).toEqual([
        'firstName must be shorter than or equal to 100 characters',
        'lastName must be shorter than or equal to 100 characters',
        'phone must be shorter than or equal to 100 characters',
        'email must be shorter than or equal to 100 characters',
        'document must be a valid CPF (11 digits) or CNPJ (14 digits)',
      ]);
    });

    it('Should validate document invalid with min length', () => {
      const customer = createCustomer();
      customer.updateDocument('12345');
      expect(customer.notification.hasErrors()).toBe(true);
      expect(customer.notification.messages()).toContain(
        'document must be a valid CPF (11 digits) or CNPJ (14 digits)',
      );
    });

    it('Should validate document invalid with max length', () => {
      const customer = createCustomer();
      customer.updateDocument('123456789012345');
      expect(customer.notification.hasErrors()).toBe(true);
      expect(customer.notification.messages()).toContain(
        'document must be a valid CPF (11 digits) or CNPJ (14 digits)',
      );
    });

    it('Should validate document invalid with in-between length', () => {
      const customer = createCustomer();
      customer.updateDocument('123456789012');
      expect(customer.notification.hasErrors()).toBe(true);
      expect(customer.notification.messages()).toContain(
        'document must be a valid CPF (11 digits) or CNPJ (14 digits)',
      );
    });

    it('Should validate document as valid CNPJ (14 digits)', () => {
      const customer = createCustomer();
      customer.updateDocument('12345678901234');
      expect(customer.notification.hasErrors()).toBe(false);
    });
  });
});
