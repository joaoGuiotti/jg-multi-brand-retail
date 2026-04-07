import {
  PdfFooterOptions,
  PdfHeaderOptions,
  PdfTableOptions,
} from './pdf.interfaces';
import { PdfService } from './pdf.service';

/**
 * Fluent builder for PDF documents.
 * Allows chaining methods to customize the document before finalization.
 */
export class PdfBuilder {
  private lastHeader?: PdfHeaderOptions;
  private lastLogoBuffer?: Buffer;

  constructor(
    private readonly doc: PDFKit.PDFDocument,
    private readonly pdfService: PdfService,
    private readonly margin: number = 40,
  ) {}

  /**
   * Internal helper to track header state for cloning.
   */
  private trackHeader(header: PdfHeaderOptions, logoBuffer?: Buffer): void {
    this.lastHeader = header;
    this.lastLogoBuffer = logoBuffer;
  }

  /**
   * Gives direct access to the underlying PDFKit document instance.
   */
  getDoc(): PDFKit.PDFDocument {
    return this.doc;
  }

  /**
   * Adds a new page to the document.
   */
  addPage(options?: PDFKit.PDFDocumentOptions): PdfBuilder {
    this.doc.addPage(options);
    return this;
  }

  addHeader(header: PdfHeaderOptions, logoBuffer?: Buffer): PdfBuilder {
    this.trackHeader(header, logoBuffer);
    this.pdfService.renderHeader(this.doc, header, this.margin, logoBuffer);
    return this;
  }

  addTable<T>(table: PdfTableOptions<T>): PdfBuilder {
    this.pdfService.renderTable(this.doc, table, this.margin);
    return this;
  }

  /**
   * Adds arbitrary content to the document using a callback.
   */
  addContent(fn: (doc: PDFKit.PDFDocument) => void): PdfBuilder {
    fn(this.doc);
    return this;
  }

  /**
   * Utility method to add a summary section with a label and value.
   */
  addSummaryRow(
    label: string,
    value: string,
    L?: number,
    R?: number,
  ): PdfBuilder {
    this.pdfService.summaryRow(this.doc, label, value, L ?? this.margin, R);
    return this;
  }

  addBreakLine(lines: number = 1): PdfBuilder {
    this.doc.moveDown(lines);
    return this;
  }

  goToNextPage(cloneHeader: boolean = false): PdfBuilder {
    this.doc.addPage();

    if (cloneHeader && this.lastHeader) {
      this.pdfService.renderHeader(
        this.doc,
        this.lastHeader,
        this.margin,
        this.lastLogoBuffer,
      );
    }
    return this;
  }

  /**
   * Finalizes the document and returns its contents as a Buffer.
   */
  async toBuffer(options?: { footer?: PdfFooterOptions }): Promise<Buffer> {
    return this.pdfService.pdfToBuffer(this.doc, options);
  }
}
