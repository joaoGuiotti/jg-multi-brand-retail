import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';

export type SaleItemOutput = {
    id: string;
    productId: string;
    product?: {
        name: string;
        sku: string;
    } | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
};

export type SaleOutput = {
    id: string;
    tenantId: string;
    userId: string;
    invoiceNumber?: string | null;
    subtotal: number;
    discount: number;
    total: number;
    status: string;
    items: SaleItemOutput[];
    createdAt?: Date;
    updatedAt?: Date;
};

export class SaleItemOutputMapper {
    static toOutput(item: SaleItem): SaleItemOutput {
        return {
            id: item.id.toString(),
            productId: item.productId,
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
        };
    }
}

export class SaleOutputMapper {
    static toOutput(entity: Sale): SaleOutput {
        return {
            id: entity.id.toString(),
            tenantId: entity.tenantId,
            userId: entity.userId,
            invoiceNumber: entity.invoiceNumber,
            subtotal: entity.subtotal,
            discount: entity.discount,
            total: entity.total,
            status: entity.status,
            items: entity.items.map(SaleItemOutputMapper.toOutput),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
