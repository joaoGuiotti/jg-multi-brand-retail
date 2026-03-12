import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// ─── Generic Document Types ───────────────────────────────────────────────────

export interface PdfHeaderOptions {
    /** Large primary title */
    title: string;
    /** Smaller subtitle below the title */
    subtitle?: string;
    /** Optional URL to a logo image (PNG/JPEG) to render above the title */
    logoUrl?: string | null;
    /** Title/Logo alignment. Default: 'center' */
    align?: 'left' | 'center';
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
    /** Text alignment. Default: 'left', or 'right' for currency/number */
    align?: 'left' | 'center' | 'right';
    /**
     * Optional column type for automatic formatting:
     * - 'currency'  → formats as BRL: "R$ 1.234,56"
     * - 'number'    → formats with locale thousand separators
     * - 'date'      → formats as dd/mm/yyyy
     */
    type?: 'currency' | 'number' | 'date';
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
    /** URL to logo image rendered above the store name */
    logoUrl?: string | null;
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
        const footerReserve = options.footer ? 40 : 0;

        // Pre-fetch logo if provided (outside Promise to allow await)
        let logoBuffer: Buffer | undefined;
        if (options.header?.logoUrl) {
            logoBuffer = await this.fetchImageBuffer(options.header.logoUrl).catch((err) => {
                console.error(`[PdfService] Failed to fetch logo from ${options.header?.logoUrl}:`, err.message);
                return undefined;
            });
        }

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                margin,
                size: options.size ?? 'A4',
                bufferPages: true,
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Header ──────────────────────────────────────────────────────
            if (options.header) {
                this.renderHeader(doc, options.header, margin, logoBuffer);
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

        // Pre-fetch logo if provided
        let logoBuffer: Buffer | undefined;
        if (data.logoUrl) {
            logoBuffer = await this.fetchImageBuffer(data.logoUrl).catch(() => undefined);
        }

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: [340, 842] });
            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Store Header ─────────────────────────────────────────────────
            const logoSize = 40;
            const gap = 10;
            const sStartY = doc.y;

            if (logoBuffer) {
                doc.fontSize(18).font('Helvetica-Bold');
                const nameW = doc.widthOfString(data.storeName.toUpperCase());
                const totalW = logoSize + gap + nameW;
                const blockX = L + (R - L - totalW) / 2;

                const headerH = Math.max(logoSize, 22); // font height approx 22

                // Logo
                doc.image(logoBuffer, blockX, sStartY + (headerH - logoSize) / 2, {
                    width: logoSize,
                    height: logoSize,
                    fit: [logoSize, logoSize],
                });

                // Name
                doc.fontSize(18).font('Helvetica-Bold').fillColor('#111111')
                    .text(data.storeName.toUpperCase(), blockX + logoSize + gap, sStartY + (headerH - 22) / 2 + 3);

                doc.y = sStartY + headerH + 5;
            } else {
                doc.fontSize(18).font('Helvetica-Bold').fillColor('#111111')
                    .text(data.storeName.toUpperCase(), { align: 'center' });
            }

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
            data.items.forEach((item, idx) => {
                const y = doc.y;
                doc.text(item.name, L, y, { width: 130, lineBreak: true });
                const afterName = doc.y;
                doc.text(String(item.quantity),                                                      175, y, { width: 35, align: 'center' });
                doc.text(item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 213, y, { width: 42, align: 'right' });
                doc.text(item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),     258, y, { width: 42, align: 'right' });
                doc.y = Math.max(afterName, doc.y);

                // Hairline separator between items (skip after last)
                if (idx < data.items.length - 1) {
                    const sepY = doc.y + 1;
                    doc.moveTo(L, sepY).lineTo(R, sepY).lineWidth(0.3).strokeColor('#dddddd').stroke();
                    doc.lineWidth(1);
                    doc.y = sepY + 2;
                }
            });

            doc.moveDown(0.2);
            this.drawDivider(doc, L, R);
            doc.moveDown(0.5);

            // ── Summary ───────────────────────────────────────────────────────
            doc.fontSize(9);
            this.summaryRow(doc, 'Subtotal:', data.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), L, R);
            if (data.discount > 0) {
                doc.fillColor('#cc0000');
                this.summaryRow(doc, 'Discount:', `-${data.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, L, R);
                doc.fillColor('#333333');
            }
            doc.moveDown(0.3);
            this.drawDivider(doc, L, R);
            doc.moveDown(0.3);
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
            this.summaryRow(doc, 'TOTAL:', data.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), L, R);

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

    private renderHeader(doc: PDFKit.PDFDocument, header: PdfHeaderOptions, margin: number, logoBuffer?: Buffer): void {
        const align = header.align ?? 'center';
        const pageW = doc.page.width - margin * 2;
        const logoSize = 40;
        const gap = 15;

        const titleSize = 20;
        const subtitleSize = 10;

        if (logoBuffer) {
            const startY = doc.y;

            // Measure title and subtitle
            doc.fontSize(titleSize).font('Helvetica-Bold');
            const titleW = doc.widthOfString(header.title);
            const titleH = doc.heightOfString(header.title, { width: pageW - (logoSize + gap) });

            let totalTextH = titleH;
            if (header.subtitle) {
                doc.fontSize(subtitleSize).font('Helvetica');
                totalTextH += doc.heightOfString(header.subtitle, { width: pageW - (logoSize + gap) }) - 2;
            }

            const headerH = Math.max(logoSize, totalTextH);

            let blockX = margin;
            if (align === 'center') {
                // For centered headers, we only center the whole block if the title fits in one line
                if (titleH < titleSize * 1.5) {
                    const combinedW = logoSize + gap + titleW;
                    blockX = margin + (pageW - combinedW) / 2;
                }
            }

            // Render Logo
            doc.image(logoBuffer, blockX, startY + (headerH - logoSize) / 2, {
                width: logoSize,
                height: logoSize,
                fit: [logoSize, logoSize],
            });

            // Render Text
            const textX = blockX + logoSize + gap;
            const textY = startY + (headerH - totalTextH) / 2;
            const textW = pageW - (textX - margin);

            doc.fontSize(titleSize).font('Helvetica-Bold').fillColor('#111111')
                .text(header.title, textX, textY, { width: textW });

            if (header.subtitle) {
                doc.fontSize(subtitleSize).font('Helvetica').fillColor('#666666')
                    .text(header.subtitle, textX, doc.y - 2, { width: textW });
            }

            doc.y = startY + headerH + 10;
        } else {
            doc.fontSize(titleSize).font('Helvetica-Bold').fillColor('#111111')
                .text(header.title, { align: align });

            if (header.subtitle) {
                doc.fontSize(subtitleSize).font('Helvetica').fillColor('#666666')
                    .text(header.subtitle, { align: align });
            }
            doc.moveDown(0.5);
        }

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
            // ── Pass 1: resolve & format all cell values ──────────────────────
            const cells = table.columns.map((col, i) => {
                const rawValue = typeof col.key === 'function'
                    ? col.key(row)
                    : (row as any)[col.key];

                let value: string;
                if (typeof col.key === 'function') {
                    value = rawValue as string;
                } else if (col.type === 'currency') {
                    const num = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue ?? '0');
                    value = isNaN(num) ? String(rawValue ?? '') : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                } else if (col.type === 'number') {
                    const num = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue ?? '0');
                    value = isNaN(num) ? String(rawValue ?? '') : num.toLocaleString('pt-BR');
                } else if (col.type === 'date') {
                    const d = rawValue instanceof Date ? rawValue : new Date(rawValue);
                    value = isNaN(d.getTime()) ? String(rawValue ?? '') : d.toLocaleDateString('pt-BR');
                } else {
                    value = String(rawValue ?? '');
                }

                const align = col.align ?? (col.type === 'currency' || col.type === 'number' ? 'right' : 'left');
                return { value, align, width: widths[i] };
            });

            // Estimate overflow (conservative: ~16pt per line)
            if (doc.y + 16 > pageBottom) {
                doc.addPage();
                renderTableHeader();
            }

            const y = doc.y;

            // ── Pass 2: render text ───────────────────────────────────────────
            let x = margin;
            let maxH = 0;
            for (const cell of cells) {
                doc.fillColor('#333333').text(cell.value, x, y, { width: cell.width, align: cell.align });
                maxH = Math.max(maxH, doc.y - y);
                x += cell.width;
            }

            doc.y = y + maxH;

            // ── Row separator: single hairline under each row ─────────────────
            const sepY = doc.y + 1;
            doc.moveTo(margin, sepY)
                .lineTo(margin + usableWidth, sepY)
                .lineWidth(0.3)
                .strokeColor('#cccccc')
                .stroke();

            doc.y = sepY + 3;
        });

        doc.lineWidth(1).fillColor('#333333');
        doc.moveDown(0.5); // space before footer
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

    private async fetchImageBuffer(url: string, maxRedirects = 3): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const fetch = (targetUrl: string, redirectsRemaining: number) => {
                const parsedUrl = new URL(targetUrl);
                const protocol = parsedUrl.protocol === 'https:' ? https : http;

                const options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    },
                    timeout: 5000,
                };

                const request = protocol.get(targetUrl, options, (response) => {
                    const statusCode = response.statusCode ?? 0;

                    // Handle redirects
                    if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
                        if (redirectsRemaining > 0) {
                            const location = response.headers.location;
                            const absoluteLocation = location.startsWith('http')
                                ? location
                                : new URL(location, targetUrl).toString();
                            fetch(absoluteLocation, redirectsRemaining - 1);
                            return;
                        } else {
                            reject(new Error('Too many redirects'));
                            return;
                        }
                    }

                    if (statusCode !== 200) {
                        reject(new Error(`Failed to fetch image: ${statusCode}`));
                        return;
                    }

                    const data: Buffer[] = [];
                    response.on('data', (chunk) => data.push(chunk));
                    response.on('end', () => resolve(Buffer.concat(data)));
                });

                request.on('error', reject);
                request.on('timeout', () => {
                    request.destroy();
                    reject(new Error('Image fetch timeout'));
                });
            };

            fetch(url, maxRedirects);
        });
    }
}
