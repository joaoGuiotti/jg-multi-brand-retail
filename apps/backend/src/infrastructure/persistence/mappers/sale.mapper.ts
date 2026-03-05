import { Sale as PrismaSale, SaleItem as PrismaSaleItem } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Sale, SaleItem } from '../../../domain/entities/sales/sale.entity';

export class SaleMapper {
    static toDomain(raw: PrismaSale & {
        items?: (PrismaSaleItem & { product?: { name: string; sku: string } | null })[],
        customer?: { firstName: string; lastName: string } | null
    }): Sale {
        const items = (raw.items || []).map(item => SaleItem.create(
            {
                productId: item.productId,
                product: item.product,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                discount: Number(item.discount),
                total: Number(item.total),
            },
            new UniqueEntityID(item.id)
        ));

        return Sale.create(
            {
                userId: raw.userId,
                customerId: raw.customerId,
                customerName: raw.customer ? `${raw.customer.firstName} ${raw.customer.lastName}`.trim() : null,
                invoiceNumber: raw.invoiceNumber,
                subtotal: Number(raw.subtotal),
                discount: Number(raw.discount),
                total: Number(raw.total),
                status: raw.status as any,
                items,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            },
            new UniqueEntityID(raw.id)
        );
    }

    static toPersistence(sale: Sale) {
        return {
            id: sale.id.toString(),
            userId: sale.userId,
            customerId: sale.customerId,
            invoiceNumber: sale.invoiceNumber,
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
            status: sale.status,
            createdAt: sale.createdAt,
            updatedAt: sale.updatedAt,
        };
    }

    static toPersistenceItem(item: SaleItem, saleId: string) {
        return {
            id: item.id.toString(),
            saleId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
        };
    }
}
