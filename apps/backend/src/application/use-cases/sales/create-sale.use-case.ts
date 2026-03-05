import { UseCase } from '@common/application/use-case.interface';
import { Sale, SaleItem } from '@domain/entities/sales/sale.entity';
import { ProductRepository } from '@domain/repositories/product-repository';
import { SaleRepository } from '@domain/repositories/sale-repository';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SaleOutput, SaleOutputMapper } from './common/sale-output';

export type CreateSaleItemInput = {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
};

export type CreateSaleInput = {
    tenantId: string;
    userId: string;
    customerId?: string;
    items: CreateSaleItemInput[];
    discount?: number;
};

@Injectable()
export class CreateSaleUseCase implements UseCase<CreateSaleInput, SaleOutput> {
    constructor(
        private saleRepository: SaleRepository,
        private productRepository: ProductRepository,
        private prisma: PrismaService,
    ) { }

    async execute(input: CreateSaleInput): Promise<SaleOutput> {
        const { tenantId, userId, customerId, items: itemsInput, discount: saleDiscount } = input;

        if (customerId) {
            const customer = await this.prisma.customer.findFirst({
                where: { id: customerId, tenantId },
            });
            if (!customer) {
                throw new NotFoundException(`Customer ${customerId} not found`);
            }
        }
        const items: SaleItem[] = [];
        let subtotal = 0;

        for (const itemDto of itemsInput) {
            const product = await this.productRepository.findById(tenantId, itemDto.productId);

            if (!product) {
                throw new NotFoundException(`Product ${itemDto.productId} not found`);
            }

            if (!product.active) {
                throw new BadRequestException(`Product ${product.name} is not active`);
            }

            if (product.stockQuantity < itemDto.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${itemDto.quantity}`,
                );
            }

            const itemSubtotal = itemDto.unitPrice * itemDto.quantity;
            const itemDiscount = itemDto.discount || 0;
            const itemTotal = itemSubtotal - itemDiscount;
            subtotal += itemTotal;

            items.push(SaleItem.create({
                productId: itemDto.productId,
                quantity: itemDto.quantity,
                unitPrice: itemDto.unitPrice,
                discount: itemDiscount,
                total: itemTotal,
            }));

            product.adjustStock(-itemDto.quantity);
            await this.productRepository.update(tenantId, product);
        }

        const discount = saleDiscount || 0;
        const total = subtotal - discount;

        const sale = Sale.create({
            userId,
            customerId,
            subtotal,
            discount,
            total,
            status: 'PENDING',
            items,
        });

        const created = await this.saleRepository.create(tenantId, sale);
        return SaleOutputMapper.toOutput(created, tenantId);
    }
}
