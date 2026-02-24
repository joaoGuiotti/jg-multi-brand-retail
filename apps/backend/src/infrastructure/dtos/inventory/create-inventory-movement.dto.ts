import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Match Prisma MovementType enum values exactly
export enum MovementType {
    ENTRY = 'ENTRY',
    EXIT = 'EXIT',
    ADJUSTMENT = 'ADJUSTMENT',
    RETURN = 'RETURN',
}

export class CreateInventoryMovementDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsEnum(MovementType)
    type: MovementType;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    reference?: string;
}
