import { PdfDocumentOptions, PdfFooterOptions, PdfListOptions, ReceiptData } from './pdf.interfaces';
import { PdfService } from './pdf.service';

export interface IPdfStrategy {
    render(doc: PDFKit.PDFDocument): Promise<void>;
}

export class GenericPdfStrategy<T = Record<string, unknown>> implements IPdfStrategy {
    constructor(
        private options: PdfDocumentOptions<T>,
        private pdfService: PdfService
    ) { }

    async render(doc: PDFKit.PDFDocument): Promise<void> {
        const margin = this.options.margin ?? 40;
        const footerReserve = this.options.footer ? 40 : 0;

        // Pre-fetch logo if provided
        let logoBuffer: Buffer | undefined;
        if (this.options.header?.logoUrl) {
            logoBuffer = await this.pdfService.fetchImageBuffer(this.options.header.logoUrl).catch((err) => {
                console.error(`[PdfService] Failed to fetch logo from ${this.options.header?.logoUrl}:`, err.message);
                return undefined;
            });
        }

        // Header
        if (this.options.header) {
            this.pdfService.renderHeader(doc, this.options.header, margin, logoBuffer);
        }

        // Table
        if (this.options.table) {
            this.pdfService.renderTable(doc, this.options.table, margin, footerReserve);
        }

        // Custom Body
        if (this.options.body) {
            this.options.body(doc);
        }
    }
}

export class ListPdfStrategy<T = Record<string, unknown>> implements IPdfStrategy {
    constructor(
        private options: PdfListOptions<T>,
        private pdfService: PdfService
    ) { }

    async render(doc: PDFKit.PDFDocument): Promise<void> {
        const strategy = new GenericPdfStrategy(
            {
                header: this.options.header,
                footer: this.options.footer,
                table: this.options.table,
                body: this.options.body,
                size: this.options.size,
                margin: this.options.margin,
            },
            this.pdfService
        );
        await strategy.render(doc);
    }
}

export class ReceiptPdfStrategy implements IPdfStrategy {
    constructor(
        private data: ReceiptData,
        private footer: PdfFooterOptions | undefined,
        private pdfService: PdfService
    ) { }

    async render(doc: PDFKit.PDFDocument): Promise<void> {
        const L = 40;
        const R = 300;

        // Pre-fetch logo if provided
        let logoBuffer: Buffer | undefined;
        if (this.data.logoUrl) {
            logoBuffer = await this.pdfService.fetchImageBuffer(this.data.logoUrl).catch(() => undefined);
        }

        this.renderReceiptHeader(doc, L, R, logoBuffer);
        this.renderReceiptMeta(doc, L, R);
        this.renderReceiptItems(doc, L, R);
        this.renderReceiptSummary(doc, L, R);
        this.renderReceiptFooter(doc, R);
    }

    private renderReceiptHeader(doc: PDFKit.PDFDocument, L: number, R: number, logoBuffer?: Buffer): void {
        const logoSize = 40;
        const gap = 10;
        const sStartY = doc.y;

        if (logoBuffer) {
            doc.fontSize(18).font('Helvetica-Bold');
            const nameW = doc.widthOfString(this.data.storeName.toUpperCase());
            const totalW = logoSize + gap + nameW;
            const blockX = L + (R - L - totalW) / 2;

            const headerH = Math.max(logoSize, 22);

            doc.image(logoBuffer, blockX, sStartY + (headerH - logoSize) / 2, {
                width: logoSize,
                height: logoSize,
                fit: [logoSize, logoSize],
            });

            doc.fontSize(18).font('Helvetica-Bold').fillColor('#111111')
                .text(this.data.storeName.toUpperCase(), blockX + logoSize + gap, sStartY + (headerH - 22) / 2 + 3);

            doc.y = sStartY + headerH + 5;
        } else {
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#111111')
                .text(this.data.storeName.toUpperCase(), { align: 'center' });
        }

        if (this.data.storeSlogan) {
            doc.fontSize(8).font('Helvetica').fillColor('#888888')
                .text(this.data.storeSlogan, { align: 'center' });
        }

        doc.moveDown(0.5);
        this.pdfService.drawDivider(doc, L, R);
        doc.moveDown(0.5);
    }

    private renderReceiptMeta(doc: PDFKit.PDFDocument, L: number, R: number): void {
        doc.fontSize(8).font('Helvetica').fillColor('#444444');
        const shortId = this.data.invoiceNumber || this.data.id.substring(0, 8).toUpperCase();
        doc.text(`Invoice:   #${shortId}`, L);
        if (this.data.createdAt) {
            const d = this.data.createdAt.toLocaleDateString('pt-BR');
            const t = this.data.createdAt.toLocaleTimeString('pt-BR');
            doc.text(`Date:      ${d}  ${t}`, L);
        }
        if (this.data.customerName) {
            doc.text(`Customer:  ${this.data.customerName}`, L);
        }

        doc.moveDown(0.5);
        this.pdfService.drawDivider(doc, L, R);
        doc.moveDown(0.5);
    }

    private renderReceiptItems(doc: PDFKit.PDFDocument, L: number, R: number): void {
        // Items header
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
        const hY = doc.y;
        doc.text('ITEM', L, hY, { width: 130 });
        doc.text('QTY', 175, hY, { width: 35, align: 'center' });
        doc.text('PRICE', 213, hY, { width: 42, align: 'right' });
        doc.text('TOTAL', 258, hY, { width: 42, align: 'right' });
        doc.moveDown(0.3);
        this.pdfService.drawDivider(doc, L, R, true);
        doc.moveDown(0.3);

        // Items
        doc.font('Helvetica').fillColor('#333333');
        this.data.items.forEach((item, idx) => {
            const y = doc.y;
            doc.text(item.name, L, y, { width: 130, lineBreak: true });
            const afterName = doc.y;
            doc.text(String(item.quantity), 175, y, { width: 35, align: 'center' });
            doc.text(item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 213, y, { width: 42, align: 'right' });
            doc.text(item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 258, y, { width: 42, align: 'right' });
            doc.y = Math.max(afterName, doc.y);

            if (idx < this.data.items.length - 1) {
                const sepY = doc.y + 1;
                doc.moveTo(L, sepY).lineTo(R, sepY).lineWidth(0.3).strokeColor('#dddddd').stroke();
                doc.lineWidth(1);
                doc.y = sepY + 2;
            }
        });

        doc.moveDown(0.2);
        this.pdfService.drawDivider(doc, L, R);
        doc.moveDown(0.5);
    }

    private renderReceiptSummary(doc: PDFKit.PDFDocument, L: number, R: number): void {
        doc.fontSize(9);
        this.pdfService.summaryRow(doc, 'Subtotal:', this.data.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), L, R);
        if (this.data.discount > 0) {
            doc.fillColor('#cc0000');
            this.pdfService.summaryRow(doc, 'Discount:', `-${this.data.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, L, R);
            doc.fillColor('#333333');
        }
        doc.moveDown(0.3);
        this.pdfService.drawDivider(doc, L, R);
        doc.moveDown(0.3);
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
        this.pdfService.summaryRow(doc, 'TOTAL:', this.data.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), L, R);

        doc.moveDown(1.5);
        this.pdfService.drawDivider(doc, L, R, true);
        doc.moveDown(0.5);
    }

    private renderReceiptFooter(doc: PDFKit.PDFDocument, R: number): void {
        const footerText = this.footer?.text ?? 'Thank you for your purchase!';
        doc.fontSize(8).font('Helvetica').fillColor('#888888')
            .text(footerText, { align: 'center', width: R - 40 });
    }
}
