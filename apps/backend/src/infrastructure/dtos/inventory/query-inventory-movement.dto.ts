import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InventoryMovementTypes } from '../../../domain/entities/inventory/inventory-movement-type.vo';

export class QueryInventoryMovementDto {
    @IsOptional()
    @IsString()
    productId?: string;

    @IsOptional()
    @IsEnum(InventoryMovementTypes)
    type?: InventoryMovementTypes;

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
