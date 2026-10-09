import { BrazilianDocumentConstraint } from '@domain/entities/customers/customer.validator';
import { normalizeDocument } from '@domain/shared/brazilian-document';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { AddressDto } from './create-customer.dto';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  /** Enviar null/"" remove o documento do cliente. */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeDocument(value) : value,
  )
  @Validate(BrazilianDocumentConstraint)
  document?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;
}
