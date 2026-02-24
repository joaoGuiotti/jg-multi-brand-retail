import { UseCase } from '@common/application/use-case.interface';
import { Product } from '@domain/entities/products/product.entity';
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

        return ProductOutputMapper.toOutput(product);
    }

    async executeBySku(tenantId: string, sku: string): Promise<Product> {
        const product = await this.productRepository.findBySku(tenantId, sku);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async executeByBarcode(tenantId: string, barcode: string): Promise<Product> {
        const product = await this.productRepository.findByBarcode(tenantId, barcode);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }
}

export type GetProductInput = {
    tenantId: string;
    id: string;
};


