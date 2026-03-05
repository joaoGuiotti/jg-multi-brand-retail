import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QuerySaleDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

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
