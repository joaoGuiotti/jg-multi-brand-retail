import { UseCase } from '@common/application/use-case.interface';
import { SaleRepository } from '@domain/repositories/sale-repository';
import { TenantRepository } from '@domain/repositories/tenant-repository';
import { PdfService } from '@infrastructure/services/pdf';
import { Injectable } from '@nestjs/common';

export type GenerateSalesHistoryReportInput = {
    tenantId: string;
    startDate?: string;
    endDate?: string;
    status?: string;
};

@Injectable()
export class GenerateSalesHistoryReportUseCase implements UseCase<GenerateSalesHistoryReportInput, Buffer> {
    constructor(
        private tenantRepository: TenantRepository,
        private saleRepository: SaleRepository,
        private pdfService: PdfService,
    ) { }

    async execute(input: GenerateSalesHistoryReportInput): Promise<Buffer> {
        const { tenantId, startDate, endDate, status } = input;

        const [tenant, salesResult] = await Promise.all([
            this.tenantRepository.findById(tenantId),
            this.saleRepository.findAll(tenantId, {
                startDate,
                endDate,
                status,
                limit: 1000,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            }),
        ]);

        const sales = salesResult.data;

        const now = new Date();
        const storeName = tenant?.name ?? 'My Store';


        const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
        const totalItems = sales.reduce((acc, sale) => acc + sale.items.length, 0);

        return (await this.pdfService.startDocumentBuilder({
            header: {
                title: `${storeName} — Sales History Report`,
                subtitle: `Generated on ${now.toLocaleDateString('pt-BR')} at ${now.toLocaleTimeString('pt-BR')}`,
                logoUrl: tenant?.logoUrl,
                align: 'left',
            },
            footer: {
                text: `${storeName} Sales History Report — ${now.toLocaleDateString('pt-BR')} — Confidential`,
                showPageNumbers: true,
            },
        }))
            .addTable({
                columns: [
                    { label: 'Invoice', formatter: 'invoiceNumber', width: 80 },
                    { label: 'Date', formatter: (s) => s.createdAt ? new Date(s.createdAt).toLocaleDateString('pt-BR') : '-', width: 100 },
                    { label: 'Items', formatter: (s) => `${s.items.length} items` },
                    { label: 'Status', formatter: 'status', width: 80 },
                    { label: 'Total', formatter: 'total', type: 'currency', width: 80, align: 'right' },
                ],
                rows: sales,
            })
            .goToNextPage()
            .addBreakLine(2)
            .addSummaryRow('Total Sales', totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
            .addSummaryRow('Total Items', totalItems.toString())
            .toBuffer();
    }
}
