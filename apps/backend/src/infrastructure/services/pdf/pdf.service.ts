import { Injectable } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import PDFDocument from 'pdfkit';
import { URL } from 'url';
import { PdfBuilder } from './pdf.builder';
import {
  PdfDocumentOptions,
  PdfFooterOptions,
  PdfHeaderOptions,
  PdfListOptions,
  PdfTableOptions,
  ReceiptData,
} from './pdf.interfaces';
import {
  GenericPdfStrategy,
  ListPdfStrategy,
  ReceiptPdfStrategy,
} from './pdf.strategies';

@Injectable()
export class PdfService {
  // ── Generic document generator ──────────────────────────────────────────

  async startDocumentBuilder(
    options?: PdfDocumentOptions,
  ): Promise<PdfBuilder> {
    const doc = new PDFDocument({
      margin: options?.margin ?? 40,
      size: options?.size ?? 'A4',
      bufferPages: true,
    });

    const margin = options?.margin ?? 40;
    const builder = new PdfBuilder(doc, this, margin);

    if (options?.header) {
      let logoBuffer: Buffer | undefined;
      if (options.header.logoUrl) {
        logoBuffer = await this.fetchImageBuffer(options.header.logoUrl).catch(
          () => undefined,
        );
      }
      builder.addHeader(options.header, logoBuffer);
    }

    return builder;
  }

  /**
   * Renders a generic PDF document with optional header, table, custom body
   * and footer. Suitable for any list/report use-case.
   * Returns a PdfBuilder instance for fluent chaining.
   */
  async generateDocument<T>(
    options: PdfDocumentOptions<T>,
  ): Promise<PdfBuilder> {
    const doc = new PDFDocument({
      margin: options.margin ?? 40,
      size: options.size ?? 'A4',
      bufferPages: true,
    });

    const strategy = new GenericPdfStrategy(options, this);
    await strategy.render(doc);

    return new PdfBuilder(doc, this);
  }

  /**
   * Renders a standardized list report with a table and header/footer.
   * High-level wrapper around generateDocument.
   * Returns a PdfBuilder instance for fluent chaining.
   */
  async generateList<T>(options: PdfListOptions<T>): Promise<PdfBuilder> {
    const doc = new PDFDocument({
      margin: options.margin ?? 40,
      size: options.size ?? 'A4',
      bufferPages: true,
    });

    const strategy = new ListPdfStrategy(options, this);
    await strategy.render(doc);

    return new PdfBuilder(doc, this);
  }

  // ── Thermal receipt generator ────────────────────────────────────────────

  /**
   * Renders a thermal-style (narrow) receipt PDF.
   * Returns a PdfBuilder instance for fluent chaining.
   */
  async generateReceipt(
    data: ReceiptData,
    footer?: PdfFooterOptions,
  ): Promise<PdfBuilder> {
    const doc = new PDFDocument({
      margin: 40,
      size: [340, 842],
      bufferPages: true,
    });

    const strategy = new ReceiptPdfStrategy(data, footer, this);
    await strategy.render(doc);

    return new PdfBuilder(doc, this);
  }

  /**
   * Finalizes the PDF and converts it to a Buffer.
   * This handles rendering footers on all pages and calling doc.end().
   */
  async pdfToBuffer(
    doc: PDFKit.PDFDocument,
    options?: { footer?: PdfFooterOptions },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const footer = options?.footer;
      if (footer) {
        const range = doc.bufferedPageRange();
        const totalPages = range.count;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          this.renderFooter(doc, footer, i + 1, totalPages);
        }
        doc.switchToPage(totalPages - 1);
      }

      doc.end();
    });
  }

  // ─── Generic Helpers ──────────────────────────────────────────────────────

  public renderHeader(
    doc: PDFKit.PDFDocument,
    header: PdfHeaderOptions,
    margin: number,
    logoBuffer?: Buffer,
  ): void {
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
      const titleH = doc.heightOfString(header.title, {
        width: pageW - (logoSize + gap),
      });

      let totalTextH = titleH;
      if (header.subtitle) {
        doc.fontSize(subtitleSize).font('Helvetica');
        totalTextH +=
          doc.heightOfString(header.subtitle, {
            width: pageW - (logoSize + gap),
          }) - 2;
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

      doc
        .fontSize(titleSize)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text(header.title, textX, textY, { width: textW });

      if (header.subtitle) {
        doc
          .fontSize(subtitleSize)
          .font('Helvetica')
          .fillColor('#666666')
          .text(header.subtitle, textX, doc.y - 2, { width: textW });
      }

      doc.y = startY + headerH + 10;
    } else {
      doc
        .fontSize(titleSize)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text(header.title, { align: align });

      if (header.subtitle) {
        doc
          .fontSize(subtitleSize)
          .font('Helvetica')
          .fillColor('#666666')
          .text(header.subtitle, { align: align });
      }
      doc.moveDown(0.5);
    }

    this.drawDivider(doc, margin, doc.page.width - margin);
    doc.moveDown(0.5);
  }

  public renderFooter(
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
      doc.text(`Page ${page} of ${total}`, margin, y, {
        width: w,
        align: 'right',
      });
    }
    doc.text(footer.text, margin, y, { width: w, align: 'left' });

    doc.restore();
  }

  public renderTable<T>(
    doc: PDFKit.PDFDocument,
    table: PdfTableOptions<T>,
    margin: number,
    footerReserve = 0,
  ): void {
    const usableWidth = doc.page.width - margin * 2;
    // Bottom boundary: stop before footer zone
    const pageBottom = doc.page.height - margin - footerReserve - 16;

    // Calculate column widths
    const explicitTotal = table.columns.reduce((s, c) => s + (c.width ?? 0), 0);
    const flexCols = table.columns.filter((c) => !c.width).length;
    const remainingWidth = usableWidth - explicitTotal;
    const flexWidth = flexCols > 0 ? remainingWidth / flexCols : 0;
    const widths = table.columns.map((c) => c.width ?? flexWidth);

    const renderTableHeader = () => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      let x = margin;
      const hY = doc.y;
      table.columns.forEach((col, i) => {
        doc.text(col.label, x, hY, {
          width: widths[i],
          align: col.align ?? 'left',
        });
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
        const rawValue =
          typeof col.formatter === 'function'
            ? col.formatter(row)
            : (row as any)[col.formatter];

        let value: string;
        if (typeof col.formatter === 'function') {
          value = rawValue as string;
        } else if (col.type === 'currency') {
          const num =
            typeof rawValue === 'number'
              ? rawValue
              : parseFloat(rawValue ?? '0');
          value = isNaN(num)
            ? String(rawValue ?? '')
            : num.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              });
        } else if (col.type === 'number') {
          const num =
            typeof rawValue === 'number'
              ? rawValue
              : parseFloat(rawValue ?? '0');
          value = isNaN(num)
            ? String(rawValue ?? '')
            : num.toLocaleString('pt-BR');
        } else if (col.type === 'date') {
          const d = rawValue instanceof Date ? rawValue : new Date(rawValue);
          value = isNaN(d.getTime())
            ? String(rawValue ?? '')
            : d.toLocaleDateString('pt-BR');
        } else {
          value = String(rawValue ?? '');
        }

        const align =
          col.align ??
          (col.type === 'currency' || col.type === 'number' ? 'right' : 'left');
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
        doc
          .fillColor('#333333')
          .text(cell.value, x, y, { width: cell.width, align: cell.align });
        maxH = Math.max(maxH, doc.y - y);
        x += cell.width;
      }

      doc.y = y + maxH;

      // ── Row separator: single hairline under each row ─────────────────
      const sepY = doc.y + 1;
      doc
        .moveTo(margin, sepY)
        .lineTo(margin + usableWidth, sepY)
        .lineWidth(0.3)
        .strokeColor('#cccccc')
        .stroke();

      doc.y = sepY + 3;
    });

    doc.lineWidth(1).fillColor('#333333');
    doc.moveDown(0.5); // space before footer
  }

  public drawDivider(
    doc: PDFKit.PDFDocument,
    x1: number,
    x2: number,
    dashed = false,
  ): void {
    const y = doc.y;
    if (dashed) doc.dash(3, { space: 3 });
    doc.moveTo(x1, y).lineTo(x2, y).strokeColor('#cccccc').stroke();
    if (dashed) doc.undash();
  }

  public summaryRow(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    L: number = 40,
    R?: number,
  ): void {
    const margin = L;
    const targetR = R ?? doc.page.width - margin;

    // Ensure we have space
    if (doc.y + 20 > doc.page.height - 40) {
      doc.addPage();
    }

    const y = doc.y;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111111');
    doc.text(label, L, y);

    doc.font('Helvetica').fillColor('#333333');
    doc.text(value, L, y, { align: 'right', width: targetR - L });

    doc.moveDown(0.5);
  }

  public async fetchImageBuffer(
    url: string,
    maxRedirects = 3,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const fetch = (targetUrl: string, redirectsRemaining: number) => {
        const parsedUrl = new URL(targetUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          timeout: 5000,
        };

        const request = protocol.get(targetUrl, options, (response) => {
          const statusCode = response.statusCode ?? 0;

          // Handle redirects
          if (
            statusCode >= 300 &&
            statusCode < 400 &&
            response.headers.location
          ) {
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
