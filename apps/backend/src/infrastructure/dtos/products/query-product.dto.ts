import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QueryProductDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    brandId?: string;

    @IsOptional()
    @IsString()
    supplierId?: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    active?: boolean;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page: number = 1;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit: number = 10;

    @IsString()
    sortBy: string = 'createdAt';

    @IsString()
    sortOrder: 'asc' | 'desc' = 'desc';
}
