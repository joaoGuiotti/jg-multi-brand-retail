import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
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

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @Type(() => AddressDto)
    @IsOptional()
    address?: AddressDto;
}
