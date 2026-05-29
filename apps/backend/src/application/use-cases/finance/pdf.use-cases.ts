import { Injectable } from '@nestjs/common';
import { PdfService } from '../../../infrastructure/services/pdf/pdf.service';
import { CalculateDREUseCase } from './reports.use-cases';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { UseCase } from '../../../common/application/use-case.interface';

@Injectable()
export class GenerateDREPdfUseCase implements UseCase<{ tenantId: string, month: number, year: number }, any> {
  constructor(
    private pdfService: PdfService,
    private calculateDRE: CalculateDREUseCase,
    private prisma: PrismaService,
  ) {}

  async execute(input: { tenantId: string, month: number, year: number }): Promise<Buffer> {
    const dre = await this.calculateDRE.execute(input);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: input.tenantId } });

    const builder = await this.pdfService.startDocumentBuilder({
      header: {
        title: `DRE - Demonstracao do Resultado`,
        subtitle: `${tenant?.name || 'Empresa'} - Periodo: ${String(input.month).padStart(2, '0')}/${input.year}`,
        logoUrl: tenant?.logoUrl,
        align: 'center',
      }
    });

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    builder.addBreakLine(2);
    builder.addSummaryRow('Receita Bruta (+)', formatCurrency(dre.grossRevenue));
    builder.addSummaryRow('Custo Mercadoria Vendida (-)', formatCurrency(dre.cmv));
    builder.addBreakLine(1);
    builder.addSummaryRow('Lucro Bruto (=)', formatCurrency(dre.grossProfit));
    builder.addBreakLine(1);
    builder.addSummaryRow('Despesas Operacionais (-)', formatCurrency(dre.expenses));
    builder.addBreakLine(1);
    builder.addContent((doc) => {
      this.pdfService.drawDivider(doc, 40, doc.page.width - 40, true);
    });
    builder.addBreakLine(1);
    builder.addSummaryRow('Lucro Liquido (=)', formatCurrency(dre.netProfit));

    return builder.toBuffer({ footer: { showPageNumbers: true, text: `Gerado em ${new Date().toLocaleDateString('pt-BR')}` } });
  }
}
