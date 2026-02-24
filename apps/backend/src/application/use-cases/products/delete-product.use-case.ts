import { UseCase } from '@common/application/use-case.interface';
import { ProductRepository } from '@domain/repositories/product-repository';
import { Injectable, NotFoundException } from '@nestjs/common';

export type DeleteProductInput = {
    tenantId: string;
    id: string;
};

@Injectable()
export class DeleteProductUseCase implements UseCase<DeleteProductInput, void> {
    constructor(private productRepository: ProductRepository) { }

    async execute(input: DeleteProductInput): Promise<void> {
        const { tenantId, id } = input;
        const product = await this.productRepository.findById(tenantId, id);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        await this.productRepository.delete(tenantId, id);
    }
}
