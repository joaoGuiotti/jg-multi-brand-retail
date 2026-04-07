import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InventoryMovementTypes } from '../../../domain/entities/inventory/inventory-movement-type.vo';

export class CreateInventoryMovementDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsEnum(InventoryMovementTypes)
  type: InventoryMovementTypes;

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
