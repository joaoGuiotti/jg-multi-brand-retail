import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { ProductRepository } from '../../../domain/repositories/product-repository';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { SaleOutput, SaleOutputMapper } from './common/sale-output';

export type CancelSaleInput = { tenantId: string; id: string };

@Injectable()
export class CancelSaleUseCase implements UseCase<CancelSaleInput, SaleOutput> {
    constructor(
        private saleRepository: SaleRepository,
        private productRepository: ProductRepository,
    ) { }

    async execute(input: CancelSaleInput): Promise<SaleOutput> {
        const { tenantId, id } = input;
        const sale = await this.saleRepository.findById(tenantId, id);

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        try {
            sale.cancel();
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }

        // Restore stock
        for (const item of sale.items) {
            const product = await this.productRepository.findById(tenantId, item.productId);
            if (product) {
                product.adjustStock(item.quantity);
                await this.productRepository.update(product);
            }
        }

        const updated = await this.saleRepository.update(sale);
        return SaleOutputMapper.toOutput(updated);
    }
}
