import { UseCase } from '@common/application/use-case.interface';
import { Product } from '@domain/entities/products/product.entity';
import { ProductRepository } from '@domain/repositories/product-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainEventPublisher } from '@common/application/domain-event-publisher';

export type UpdateStockInput = {
  tenantId: string;
  id: string;
  quantity: number;
};

@Injectable()
export class UpdateStockUseCase implements UseCase<UpdateStockInput, Product> {
  constructor(
    private productRepository: ProductRepository,
    private eventPublisher: DomainEventPublisher
  ) {}

  async execute(input: UpdateStockInput): Promise<Product> {
    const { tenantId, id, quantity } = input;
    const product = await this.productRepository.findById(tenantId, id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.updateStock(quantity, tenantId);

    const updated = await this.productRepository.update(tenantId, product);
    await this.eventPublisher.publishEvents(product);
    return updated;
  }
}
