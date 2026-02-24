import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MovementType } from './create-inventory-movement.dto';

export class QueryInventoryMovementDto {
    @IsOptional()
    @IsString()
    productId?: string;

    @IsOptional()
    @IsEnum(MovementType)
    type?: MovementType;

    @IsOptional()
    @IsString()
    userId?: string;

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
