import { UseCase } from '@common/application/use-case.interface';
import { ProductRepository } from '@domain/repositories/product-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductOutput, ProductOutputMapper } from './common/product-output';

@Injectable()
export class GetProductUseCase implements UseCase<GetProductInput, ProductOutput> {
    constructor(private productRepository: ProductRepository) { }

    async execute(input: GetProductInput): Promise<ProductOutput> {
        const { tenantId, id } = input;
        const product = await this.productRepository.findById(tenantId, id);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return ProductOutputMapper.toOutput(product, tenantId);
    }

    async executeBySku(tenantId: string, sku: string): Promise<ProductOutput> {
        const product = await this.productRepository.findBySku(tenantId, sku);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return ProductOutputMapper.toOutput(product, tenantId);
    }

    async executeByBarcode(tenantId: string, barcode: string): Promise<ProductOutput> {
        const product = await this.productRepository.findByBarcode(tenantId, barcode);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return ProductOutputMapper.toOutput(product, tenantId);
    }
}

export type GetProductInput = {
    tenantId: string;
    id: string;
};


