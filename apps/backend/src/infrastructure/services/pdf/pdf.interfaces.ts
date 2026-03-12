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
    formatter: keyof T | ((row: T) => string);
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

export interface PdfListOptions<T = Record<string, unknown>> {
    header?: PdfHeaderOptions;
    footer?: PdfFooterOptions;
    table: PdfTableOptions<T>;
    body?: (doc: PDFKit.PDFDocument) => void;
    size?: string | [number, number];
    margin?: number;
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