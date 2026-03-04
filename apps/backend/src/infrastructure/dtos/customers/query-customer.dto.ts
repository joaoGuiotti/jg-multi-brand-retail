import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QueryCustomerDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
    isActive?: boolean;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    limit?: number;

    @IsString()
    @IsOptional()
    sortBy?: string;

    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';
}
