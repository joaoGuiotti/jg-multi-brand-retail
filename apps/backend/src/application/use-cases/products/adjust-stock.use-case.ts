import { UseCase } from '@common/application/use-case.interface';
import { Product } from '@domain/entities/products/product.entity';
import { ProductRepository } from '@domain/repositories/product-repository';
import { Injectable, NotFoundException } from '@nestjs/common';

export type AdjustStockInput = {
  tenantId: string;
  id: string;
  adjustment: number;
};

@Injectable()
export class AdjustStockUseCase implements UseCase<AdjustStockInput, Product> {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: AdjustStockInput): Promise<Product> {
    const { tenantId, id, adjustment } = input;
    const product = await this.productRepository.findById(tenantId, id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.adjustStock(adjustment);

    return this.productRepository.update(tenantId, product);
  }
}
