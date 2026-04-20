import { UseCase } from '@common/application/use-case.interface';
import { Product } from '@domain/entities/products/product.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainEventPublisher } from '@common/application/domain-event-publisher';
import { ProductRepository } from '@domain/repositories/product-repository';

export type AdjustStockInput = {
  tenantId: string;
  id: string;
  adjustment: number;
};

@Injectable()
export class AdjustStockUseCase implements UseCase<AdjustStockInput, Product> {
  constructor(
    private productRepository: ProductRepository,
    private eventPublisher: DomainEventPublisher
  ) {}

  async execute(input: AdjustStockInput): Promise<Product> {
    const { tenantId, id, adjustment } = input;
    const product = await this.productRepository.findById(tenantId, id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const type = adjustment >= 0 ? 'ENTRY' : 'EXIT';
    product.adjustStock(adjustment, tenantId, type);

    const updated = await this.productRepository.update(tenantId, product);
    await this.eventPublisher.publishEvents(product);
    
    return updated;
  }
}
