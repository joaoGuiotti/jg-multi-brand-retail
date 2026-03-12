import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { TenantRepository } from '../../../domain/repositories/tenant-repository';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { PdfService } from '../../../infrastructure/services/pdf.service';

export type GenerateSaleReceiptInput = { tenantId: string; id: string };

@Injectable()
export class GenerateSaleReceiptUseCase implements UseCase<GenerateSaleReceiptInput, Buffer> {
    constructor(
        private saleRepository: SaleRepository,
        private tenantRepository: TenantRepository,
        private pdfService: PdfService,
    ) { }

    async execute(input: GenerateSaleReceiptInput): Promise<Buffer> {
        const [sale, tenant] = await Promise.all([
            this.saleRepository.findById(input.tenantId, input.id),
            this.tenantRepository.findById(input.tenantId),
        ]);

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        return this.pdfService.generateReceipt({
            storeName: tenant?.name ?? 'My Store',
            id: sale.id.toString(),
            invoiceNumber: sale.invoiceNumber,
            customerName: sale.customerName,
            createdAt: sale.createdAt,
            items: sale.items.map(item => ({
                name: item.product?.name || item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
            })),
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
        });
    }
}
