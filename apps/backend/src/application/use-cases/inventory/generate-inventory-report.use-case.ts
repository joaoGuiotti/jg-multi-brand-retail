import { UseCase } from '@common/application/use-case.interface';
import { InventoryRepository } from '@domain/repositories/inventory-repository';
import { TenantRepository } from '@domain/repositories/tenant-repository';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { PdfService } from '@infrastructure/services/pdf';
import { Injectable } from '@nestjs/common';

export type GenerateInventoryReportInput = {
  tenantId: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  productId?: string;
};

@Injectable()
export class GenerateInventoryReportUseCase implements UseCase<
  GenerateInventoryReportInput,
  Buffer
> {
  constructor(
    private tenantRepository: TenantRepository,
    private inventoryRepository: InventoryRepository,
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async execute(input: GenerateInventoryReportInput): Promise<Buffer> {
    const { tenantId, startDate, endDate, type, productId } = input;

    const [tenant, movementsResult, stockCounts] = await Promise.all([
      this.tenantRepository.findById(tenantId),
      this.inventoryRepository.findAll(tenantId, {
        startDate,
        endDate,
        type,
        productId,
        limit: 500,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
      this.prisma.product.groupBy({
        by: ['stockQuantity'],
        where: { tenantId },
        _count: { id: true },
        orderBy: { stockQuantity: 'asc' },
      }),
    ]);

    // Stock summary
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      select: { name: true, sku: true, stockQuantity: true },
      orderBy: { stockQuantity: 'asc' },
      take: 10, // bottom 10 by stock
    });

    const totalProducts = stockCounts.reduce((s, g) => s + g._count.id, 0);
    const outOfStock = stockCounts
      .filter((g) => g.stockQuantity === 0)
      .reduce((s, g) => s + g._count.id, 0);
    const lowStock = stockCounts
      .filter((g) => g.stockQuantity > 0 && g.stockQuantity <= 10)
      .reduce((s, g) => s + g._count.id, 0);
    const healthyStock = totalProducts - outOfStock - lowStock;

    const movements = movementsResult.data;

    // Resolve product names for all movements in one query
    const uniqueProductIds = [...new Set(movements.map((m) => m.productId))];
    const productMap = new Map<string, { name: string; sku: string | null }>();
    if (uniqueProductIds.length > 0) {
      const dbProducts = await this.prisma.product.findMany({
        where: { tenantId, id: { in: uniqueProductIds } },
        select: { id: true, name: true, sku: true },
      });
      for (const p of dbProducts)
        productMap.set(p.id, { name: p.name, sku: p.sku });
    }

    // Movement type counts
    const byType: Record<string, number> = {};
    for (const m of movements) {
      const t = m.type.value;
      byType[t] = (byType[t] ?? 0) + m.quantity;
    }

    const now = new Date();
    const storeName = tenant?.name ?? 'My Store';

    return (
      await this.pdfService.generateDocument({
        header: {
          title: `${storeName} — Inventory Report`,
          subtitle: `Generated on ${now.toLocaleDateString('pt-BR')} at ${now.toLocaleTimeString('pt-BR')}`,
          logoUrl: tenant?.logoUrl,
          align: 'left',
        },
        body: (doc) => {
          const L = 40;
          const pageW = doc.page.width - L * 2;
          const colW3 = (pageW - 20) / 3;

          // ── Section: Stock Overview ──────────────────────────────────
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#111111')
            .text('Stock Overview', L);
          doc.moveDown(0.4);

          const summaryCards = [
            {
              label: 'TOTAL PRODUCTS',
              value: String(totalProducts),
              color: '#f0f4ff',
            },
            {
              label: 'LOW STOCK (≤10)',
              value: String(lowStock),
              color: '#fffbe0',
            },
            {
              label: 'OUT OF STOCK',
              value: String(outOfStock),
              color: '#fff0f0',
            },
            {
              label: 'HEALTHY STOCK',
              value: String(healthyStock),
              color: '#f0fff4',
            },
          ];

          const cardH = 44;
          const colW2 = (pageW - 10) / 2;
          let cardRowY = doc.y;

          summaryCards.forEach((card, i) => {
            const col = i % 2;
            if (col === 0) cardRowY = doc.y;
            const x = L + col * (colW2 + 10);

            doc.save();
            doc
              .rect(x, cardRowY, colW2, cardH)
              .fill(card.color)
              .stroke('#dddddd');
            doc.restore();

            doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#666666')
              .text(card.label, x + 8, cardRowY + 8, { width: colW2 - 16 });
            doc
              .fontSize(22)
              .font('Helvetica-Bold')
              .fillColor('#111111')
              .text(card.value, x + 8, cardRowY + 18, { width: colW2 - 16 });

            if (col === 1 || i === summaryCards.length - 1) {
              doc.y = cardRowY + cardH + 8;
            }
          });

          doc.moveDown(1);
          doc
            .moveTo(L, doc.y)
            .lineTo(L + pageW, doc.y)
            .strokeColor('#eeeeee')
            .stroke();
          doc.moveDown(1);

          // ── Section: Movement Summary ────────────────────────────────
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#111111')
            .text('Movement Summary (period)', L);
          doc.moveDown(0.4);

          // 3-column cards for each movement type
          const typeEntries = Object.entries(byType);
          if (typeEntries.length === 0) {
            doc
              .fontSize(10)
              .font('Helvetica')
              .fillColor('#888888')
              .text('No movements in this period.', L);
            doc.moveDown(0.5);
          } else {
            let typeRowY = doc.y;
            typeEntries.forEach(([type, qty], i) => {
              const col = i % 3;
              if (col === 0) typeRowY = doc.y;
              const x = L + col * (colW3 + 10);

              doc.save();
              doc
                .rect(x, typeRowY, colW3, 38)
                .fill('#f8f8f8')
                .stroke('#dddddd');
              doc.restore();

              doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#666666')
                .text(type.replace(/_/g, ' '), x + 8, typeRowY + 6, {
                  width: colW3 - 16,
                });
              doc
                .fontSize(16)
                .font('Helvetica-Bold')
                .fillColor('#333333')
                .text(String(qty), x + 8, typeRowY + 18, { width: colW3 - 16 });

              if (col === 2 || i === typeEntries.length - 1) {
                doc.y = typeRowY + 46;
              }
            });
          }

          doc.moveDown(1);
          doc
            .moveTo(L, doc.y)
            .lineTo(L + pageW, doc.y)
            .strokeColor('#eeeeee')
            .stroke();
          doc.moveDown(1);

          // ── Section: Low / Out-of-Stock products ──────────────────────
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#111111')
            .text('Products Requiring Attention', L);
          doc.moveDown(0.4);

          if (products.length === 0) {
            doc
              .fontSize(10)
              .font('Helvetica')
              .fillColor('#888888')
              .text('All products are well-stocked.', L);
            doc.moveDown(0.5);
          } else {
            // Table header
            const skuW = 90,
              stockW = 80;
            const nameW = pageW - skuW - stockW;
            const tableHY = doc.y;
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#666666');
            doc.text('Product Name', L, tableHY, { width: nameW });
            doc.text('SKU', L + nameW, tableHY, { width: skuW });
            doc.text('Stock', L + nameW + skuW, tableHY, {
              width: stockW,
              align: 'right',
            });
            doc.y = tableHY + 12;
            doc.moveDown(0.2);
            doc
              .moveTo(L, doc.y)
              .lineTo(L + pageW, doc.y)
              .dash(2, { space: 2 })
              .strokeColor('#cccccc')
              .stroke()
              .undash();
            doc.moveDown(0.3);

            doc.font('Helvetica');
            products.forEach((p, i) => {
              const isOut = p.stockQuantity === 0;
              const isLow = p.stockQuantity > 0 && p.stockQuantity <= 10;
              const rowY = doc.y;

              if (i % 2 === 0) {
                doc
                  .save()
                  .rect(L, rowY - 1, pageW, 13)
                  .fill('#fafafa')
                  .restore();
              }

              doc
                .fontSize(9)
                .fillColor(isOut ? '#cc0000' : isLow ? '#b36b00' : '#333333');
              doc.text(p.name, L, rowY, { width: nameW });
              doc
                .fillColor('#666666')
                .text(p.sku ?? '-', L + nameW, rowY, { width: skuW });
              doc
                .fillColor(isOut ? '#cc0000' : '#333333')
                .text(
                  isOut ? '! OUT' : String(p.stockQuantity),
                  L + nameW + skuW,
                  rowY,
                  { width: stockW, align: 'right' },
                );

              doc.y = rowY + 13;
              doc.moveDown(0.2);
            });
          }

          // ── Section: Recent Movements ─────────────────────────────────
          // Columns (same as screen): Date | Type | Product | Qty | Reference
          if (movements.length > 0) {
            doc.moveDown(1);
            doc
              .moveTo(L, doc.y)
              .lineTo(L + pageW, doc.y)
              .strokeColor('#eeeeee')
              .stroke();
            doc.moveDown(1);
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .fillColor('#111111')
              .text('Recent Movements', L);
            doc.moveDown(0.4);

            // Column widths matching screen order: Date | Type | Product (flex) | Qty | Reference
            const dateW = 65;
            const mTypeW = 80;
            const qtyW = 40;
            const refW = 90;
            const prodW = pageW - dateW - mTypeW - qtyW - refW;

            const mHY = doc.y;
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#666666');
            doc.text('Date', L, mHY, { width: dateW });
            doc.text('Type', L + dateW, mHY, { width: mTypeW });
            doc.text('Product', L + dateW + mTypeW, mHY, { width: prodW });
            doc.text('Qty', L + dateW + mTypeW + prodW, mHY, {
              width: qtyW,
              align: 'right',
            });
            doc.text('Reference', L + dateW + mTypeW + prodW + qtyW, mHY, {
              width: refW,
              align: 'right',
            });
            doc.y = mHY + 12;
            doc.moveDown(0.2);
            doc
              .moveTo(L, doc.y)
              .lineTo(L + pageW, doc.y)
              .dash(2, { space: 2 })
              .strokeColor('#cccccc')
              .stroke()
              .undash();
            doc.moveDown(0.3);

            const rowH = 16; // taller row to fit product name + sku on two lines
            doc.font('Helvetica').fillColor('#333333');
            movements.slice(0, 30).forEach((m, i) => {
              const rowY = doc.y;
              if (i % 2 === 0) {
                doc
                  .save()
                  .rect(L, rowY - 1, pageW, rowH)
                  .fill('#fafafa')
                  .restore();
              }

              const prod = productMap.get(m.productId);
              const prodName = prod?.name ?? m.productId.substring(0, 12);
              const prodSku = prod?.sku ? ` (${prod.sku})` : '';
              const dateStr = m.createdAt
                ? m.createdAt.toLocaleDateString('pt-BR') +
                  '\n' +
                  m.createdAt.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-';

              const typeColors: Record<string, string> = {
                ENTRY: '#16803c',
                EXIT: '#cc0000',
                ADJUSTMENT: '#b36b00',
                RETURN: '#1d4ed8',
              };
              const typeColor = typeColors[m.type.value] ?? '#333333';

              doc
                .fontSize(8)
                .fillColor('#555555')
                .text(dateStr, L, rowY, { width: dateW });
              doc
                .fillColor(typeColor)
                .font('Helvetica-Bold')
                .text(m.type.value, L + dateW, rowY, { width: mTypeW });
              doc
                .fillColor('#111111')
                .font('Helvetica')
                .text(`${prodName}${prodSku}`, L + dateW + mTypeW, rowY, {
                  width: prodW,
                });
              doc
                .fillColor('#333333')
                .text(String(m.quantity), L + dateW + mTypeW + prodW, rowY, {
                  width: qtyW,
                  align: 'right',
                });
              doc
                .fillColor('#666666')
                .text(
                  m.reference ?? '—',
                  L + dateW + mTypeW + prodW + qtyW,
                  rowY,
                  { width: refW, align: 'right' },
                );

              doc.y = rowY + rowH;
              doc.moveDown(0.15);
            });

            if (movements.length > 30) {
              doc.moveDown(0.3);
              doc
                .fontSize(8)
                .fillColor('#888888')
                .text(
                  `... and ${movements.length - 30} more movements not shown.`,
                  L,
                );
            }
          }
        },
        footer: {
          text: `${storeName} Inventory Report — ${now.toLocaleDateString('pt-BR')} — Confidential`,
          showPageNumbers: true,
        },
      })
    ).toBuffer({
      footer: {
        text: `${storeName} Inventory Report — ${now.toLocaleDateString('pt-BR')} — Confidential`,
        showPageNumbers: true,
      },
    });
  }
}
