import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

// ─── Generic Document Types ───────────────────────────────────────────────────

export interface PdfHeaderOptions {
    /** Large primary title */
    title: string;
    /** Smaller subtitle below the title */
    subtitle?: string;
}

export interface PdfFooterOptions {
    /** Text to show at the bottom of every page */
    text: string;
    /** Whether to show page numbers (e.g. "Page 1 of 2"). Default: false */
    showPageNumbers?: boolean;
}

export interface PdfTableColumn<T = Record<string, unknown>> {
    /** Label shown in the table header */
    label: string;
    /** Key of the row object (or a value extractor) */
    key: keyof T | ((row: T) => string);
    /** Column width in points. Remaining space is distributed evenly if omitted. */
    width?: number;
    /** Text alignment. Default: 'left' */
    align?: 'left' | 'center' | 'right';
}

export interface PdfTableOptions<T = Record<string, unknown>> {
    columns: PdfTableColumn<T>[];
    rows: T[];
}

export interface PdfDocumentOptions<T = Record<string, unknown>> {
    /** Page size. Default: 'A4' */
    size?: string | [number, number];
    /** Margin in points. Default: 40 */
    margin?: number;
    /** Optional page header */
    header?: PdfHeaderOptions;
    /** Optional page footer */
    footer?: PdfFooterOptions;
    /** Optional table of data */
    table?: PdfTableOptions<T>;
    /** Arbitrary content rendered after the table (receives the doc instance) */
    body?: (doc: PDFKit.PDFDocument) => void;
}

// ─── Receipt-Specific Types ───────────────────────────────────────────────────

export interface ReceiptItemData {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface ReceiptData {
    /** Tenant / business name – auto-populated from TenantRepository */
    storeName: string;
    storeSlogan?: string;
    invoiceNumber?: string | null;
    id: string;
    customerName?: string | null;
    createdAt?: Date;
    items: ReceiptItemData[];
    subtotal: number;
    discount: number;
    total: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class PdfService {

    // ── Generic document generator ──────────────────────────────────────────

    /**
     * Renders a generic PDF document with optional header, table, custom body
     * and footer. Suitable for any list/report use-case.
     */
    async generateDocument<T>(options: PdfDocumentOptions<T>): Promise<Buffer> {
        const margin = options.margin ?? 40;
        // Reserve space at the bottom for the footer (text + spacing)
        const footerReserve = options.footer ? 40 : 0;

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                margin,
                size: options.size ?? 'A4',
                bufferPages: true, // required for page-number footer
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Header ──────────────────────────────────────────────────────
            if (options.header) {
                this.renderHeader(doc, options.header, margin);
            }

            // ── Custom body / table ──────────────────────────────────────────
            if (options.table) {
                this.renderTable(doc, options.table, margin, footerReserve);
            }

            if (options.body) {
                options.body(doc);
            }

            // ── Footer: iterate buffered pages BEFORE doc.end() ─────────────
            if (options.footer) {
                const range = doc.bufferedPageRange();
                const totalPages = range.count;
                for (let i = 0; i < totalPages; i++) {
                    doc.switchToPage(i);
                    this.renderFooter(doc, options.footer, i + 1, totalPages);
                }
                // Return cursor to last content page
                doc.switchToPage(totalPages - 1);
            }

            doc.end();
        });
    }

    // ── Thermal receipt generator ────────────────────────────────────────────

    /**
     * Renders a thermal-style (narrow) receipt PDF.
     * Header and footer are optional and fall back to sensible defaults.
     */
    async generateReceipt(data: ReceiptData, footer?: PdfFooterOptions): Promise<Buffer> {
        const L = 40;
        const R = 300;

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: [340, 842] });
            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Store Header ─────────────────────────────────────────────────
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#111111')
                .text(data.storeName.toUpperCase(), { align: 'center' });

            if (data.storeSlogan) {
                doc.fontSize(8).font('Helvetica').fillColor('#888888')
                    .text(data.storeSlogan, { align: 'center' });
            }

            doc.moveDown(0.5);
            this.drawDivider(doc, L, R);
            doc.moveDown(0.5);

            // ── Meta ─────────────────────────────────────────────────────────
            doc.fontSize(8).font('Helvetica').fillColor('#444444');
            const shortId = data.invoiceNumber || data.id.substring(0, 8).toUpperCase();
            doc.text(`Invoice:   #${shortId}`, L);
            if (data.createdAt) {
                const d = data.createdAt.toLocaleDateString('pt-BR');
                const t = data.createdAt.toLocaleTimeString('pt-BR');
                doc.text(`Date:      ${d}  ${t}`, L);
            }
            if (data.customerName) {
                doc.text(`Customer:  ${data.customerName}`, L);
            }

            doc.moveDown(0.5);
            this.drawDivider(doc, L, R);
            doc.moveDown(0.5);

            // ── Items header ─────────────────────────────────────────────────
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
            const hY = doc.y;
            doc.text('ITEM',   L,   hY, { width: 130 });
            doc.text('QTY',  175, hY, { width: 35, align: 'center' });
            doc.text('PRICE', 213, hY, { width: 42, align: 'right' });
            doc.text('TOTAL', 258, hY, { width: 42, align: 'right' });
            doc.moveDown(0.3);
            this.drawDivider(doc, L, R, true);
            doc.moveDown(0.3);

            // ── Items ─────────────────────────────────────────────────────────
            doc.font('Helvetica').fillColor('#333333');
            data.items.forEach(item => {
                const y = doc.y;
                doc.text(item.name, L, y, { width: 130, lineBreak: true });
                const afterName = doc.y;
                doc.text(String(item.quantity),          175, y, { width: 35, align: 'center' });
                doc.text(`R$${item.unitPrice.toFixed(2)}`, 213, y, { width: 42, align: 'right' });
                doc.text(`R$${item.total.toFixed(2)}`,     258, y, { width: 42, align: 'right' });
                doc.y = Math.max(afterName, doc.y);
                doc.moveDown(0.3);
            });

            doc.moveDown(0.2);
            this.drawDivider(doc, L, R);
            doc.moveDown(0.5);

            // ── Summary ───────────────────────────────────────────────────────
            doc.fontSize(9);
            this.summaryRow(doc, 'Subtotal:', `R$ ${data.subtotal.toFixed(2)}`, L, R);
            if (data.discount > 0) {
                doc.fillColor('#cc0000');
                this.summaryRow(doc, 'Discount:', `-R$ ${data.discount.toFixed(2)}`, L, R);
                doc.fillColor('#333333');
            }
            doc.moveDown(0.3);
            this.drawDivider(doc, L, R);
            doc.moveDown(0.3);
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
            this.summaryRow(doc, 'TOTAL:', `R$ ${data.total.toFixed(2)}`, L, R);

            doc.moveDown(1.5);
            this.drawDivider(doc, L, R, true);
            doc.moveDown(0.5);

            // ── Footer ────────────────────────────────────────────────────────
            const footerText = footer?.text ?? 'Thank you for your purchase!';
            doc.fontSize(8).font('Helvetica').fillColor('#888888')
                .text(footerText, { align: 'center' });

            doc.end();
        });
    }

    // ─── Generic Helpers ──────────────────────────────────────────────────────

    private renderHeader(doc: PDFKit.PDFDocument, header: PdfHeaderOptions, margin: number): void {
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#111111')
            .text(header.title, { align: 'center' });

        if (header.subtitle) {
            doc.fontSize(10).font('Helvetica').fillColor('#666666')
                .text(header.subtitle, { align: 'center' });
        }

        doc.moveDown(0.5);
        this.drawDivider(doc, margin, doc.page.width - margin);
        doc.moveDown(0.5);
    }

    private renderFooter(
        doc: PDFKit.PDFDocument,
        footer: PdfFooterOptions,
        page: number,
        total: number,
    ): void {
        const margin = 40;
        const y = doc.page.height - margin - 12; // 12pt above bottom margin
        const w = doc.page.width - margin * 2;

        doc.save();
        doc.fontSize(8).font('Helvetica').fillColor('#888888');

        if (footer.showPageNumbers) {
            doc.text(`Page ${page} of ${total}`, margin, y, { width: w, align: 'right' });
        }
        doc.text(footer.text, margin, y, { width: w, align: 'left' });

        doc.restore();
    }

    private renderTable<T>(doc: PDFKit.PDFDocument, table: PdfTableOptions<T>, margin: number, footerReserve = 0): void {
        const usableWidth = doc.page.width - margin * 2;
        // Bottom boundary: stop before footer zone
        const pageBottom = doc.page.height - margin - footerReserve - 16;

        // Calculate column widths
        const explicitTotal = table.columns.reduce((s, c) => s + (c.width ?? 0), 0);
        const flexCols = table.columns.filter(c => !c.width).length;
        const remainingWidth = usableWidth - explicitTotal;
        const flexWidth = flexCols > 0 ? remainingWidth / flexCols : 0;
        const widths = table.columns.map(c => c.width ?? flexWidth);

        const renderTableHeader = () => {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
            let x = margin;
            const hY = doc.y;
            table.columns.forEach((col, i) => {
                doc.text(col.label, x, hY, { width: widths[i], align: col.align ?? 'left' });
                x += widths[i];
            });
            doc.moveDown(0.3);
            this.drawDivider(doc, margin, doc.page.width - margin, true);
            doc.moveDown(0.3);
        };

        renderTableHeader();

        // Data rows
        doc.font('Helvetica').fillColor('#333333');
        table.rows.forEach((row, rowIndex) => {
            // Estimate if this row will overflow — use 30pt as safe row height estimate
            if (doc.y + 30 > pageBottom) {
                doc.addPage();
                renderTableHeader();
            }

            let x = margin;
            const y = doc.y;
            let maxH = 0;

            table.columns.forEach((col, i) => {
                const value = typeof col.key === 'function'
                    ? col.key(row)
                    : String((row as any)[col.key] ?? '');

                // Alternate row background
                if (rowIndex % 2 === 0) {
                    doc.save();
                    doc.rect(margin, y - 2, usableWidth, 16).fill('#f8f8f8');
                    doc.restore();
                }

                doc.fillColor('#333333').text(value, x, y, { width: widths[i], align: col.align ?? 'left' });
                maxH = Math.max(maxH, doc.y - y);
                x += widths[i];
            });

            doc.y = y + maxH;
            doc.moveDown(0.3);
        });

        doc.fillColor('#333333');
        doc.moveDown(1); // extra space before the footer area
    }

    private drawDivider(doc: PDFKit.PDFDocument, x1: number, x2: number, dashed = false): void {
        const y = doc.y;
        if (dashed) doc.dash(3, { space: 3 });
        doc.moveTo(x1, y).lineTo(x2, y).strokeColor('#cccccc').stroke();
        if (dashed) doc.undash();
    }

    private summaryRow(doc: PDFKit.PDFDocument, label: string, value: string, L: number, R: number): void {
        const y = doc.y;
        doc.text(label, L, y);
        doc.text(value, L, y, { align: 'right', width: R - L });
        doc.moveDown(0.3);
    }
}
