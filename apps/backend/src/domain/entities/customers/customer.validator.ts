import { ClassValidatorFields } from '@common/domain/validators/class-validator-field';
import { Notification } from '@common/domain/validators/notification';
import {
  isValidBrazilianDocument,
  normalizeDocument,
} from '@domain/shared/brazilian-document';
import {
  IsBoolean,
  MaxLength,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Customer } from './customer.entity';

@ValidatorConstraint({ name: 'brazilianDocument', async: false })
export class BrazilianDocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const normalized = normalizeDocument(value);
    return isValidBrazilianDocument(normalized);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'document must be a valid CPF (11 digits) or CNPJ (14 digits)';
  }
}

export class CustomerRules {
  @MaxLength(100, { groups: ['firstName'] })
  firstName: string;

  @MaxLength(100, { groups: ['lastName'] })
  lastName: string;

  @MaxLength(100, { groups: ['phone'] })
  phone: string;

  @MaxLength(100, { groups: ['email'] })
  email: string;

  @IsBoolean({ groups: ['isActive'] })
  isActive: boolean;

  // Documento é opcional: null = cliente sem documento (vários por tenant).
  @ValidateIf((o: CustomerRules) => o.document !== null, {
    groups: ['document'],
  })
  @Validate(BrazilianDocumentConstraint, { groups: ['document'] })
  document: string | null;

  constructor(customer: Customer) {
    this.firstName = customer.firstName;
    this.lastName = customer.lastName;
    this.phone = customer.phone;
    this.email = customer.email;
    this.isActive = customer.isActive;
    this.document = customer.document;
  }
}

export class CustomerValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const rules = new CustomerRules(data);
    const newFields = fields?.length ? fields : Object.keys(rules);
    return super.validate(notification, rules, newFields);
  }
}

export class CustomerValidatorFactory {
  static create() {
    return new CustomerValidator();
  }
}
