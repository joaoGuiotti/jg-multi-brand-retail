import { ALLOWED_PRODUCT_UNITS } from '@domain/entities/products/product.entity';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salePrice: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  margin?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_PRODUCT_UNITS, {
    message: `unit must be one of: ${ALLOWED_PRODUCT_UNITS.join(', ')}`,
  })
  unit?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsOptional()
  metadata?: any;
}
