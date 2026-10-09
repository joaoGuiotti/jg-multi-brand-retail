import { BrazilianDocumentConstraint } from '@domain/entities/customers/customer.validator';
import { normalizeDocument } from '@domain/shared/brazilian-document';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;
}

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  /** CPF/CNPJ (aceita máscara; persistido só com dígitos). Opcional. */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeDocument(value) : value,
  )
  @Validate(BrazilianDocumentConstraint)
  document?: string | null;

  @Type(() => AddressDto)
  address: AddressDto;
}
