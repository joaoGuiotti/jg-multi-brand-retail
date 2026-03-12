import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PdfService } from '../services/pdf.service';

/**
 * Dev-only controller to test PDF generation.
 * Registered only when NODE_ENV !== 'production'.
 */
@ApiTags('🧪 dev — PDF')
@Controller('dev/pdf')
export class PdfDevController {
    constructor(private pdfService: PdfService) { }

    /** Sample thermal receipt with mock data */
    @Get('receipt')
    @ApiOperation({ summary: 'Download sample thermal receipt PDF' })
    @ApiProduces('application/pdf')
    @ApiResponse({ status: 200, description: 'PDF file (thermal receipt)', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
    async sampleReceipt(@Res() res: Response) {
        const buffer = await this.pdfService.generateReceipt({
            storeName: 'Demo Store',
            storeSlogan: 'The best store in town',
            id: 'abc123',
            invoiceNumber: 'INV-2026-001',
            customerName: 'João Silva',
            createdAt: new Date(),
            items: [
                { name: 'Product A — Long name to test line wrapping behaviour', quantity: 2, unitPrice: 49.99, total: 99.98 },
                { name: 'Product B', quantity: 1, unitPrice: 199.00, total: 199.00 },
                { name: 'Product C (Special Edition)', quantity: 3, unitPrice: 15.50, total: 46.50 },
            ],
            subtotal: 345.48,
            discount: 20.00,
            total: 325.48,
        });

        this.sendPdf(res, buffer, 'sample-receipt.pdf');
    }

    /** Sample generic table/list document — 50 rows to test multi-page + footer */
    @Get('list')
    @ApiOperation({ summary: 'Download sample products list PDF (multi-page, with footer + page numbers)' })
    @ApiProduces('application/pdf')
    @ApiResponse({ status: 200, description: 'PDF file (multi-page list)', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
    async sampleList(@Res() res: Response) {
        const products = [
            { name: 'Ring Light 18"',        sku: 'LGT-RNG', stock: 11, price:  199.00 },
            { name: 'GoPro Case',            sku: 'CAS-GPR', stock: 28, price:   59.00 },
            { name: 'Tablet Stand',          sku: 'STD-TAB', stock: 16, price:   45.00 },
            { name: 'iPad Mini Case',        sku: 'CAS-IPD', stock: 21, price:   79.00 },
            { name: 'Phone Holder Car',      sku: 'HLD-PHN', stock: 35, price:   29.00 },
            { name: 'Screen Cleaner Kit',    sku: 'CLN-SCR', stock: 60, price:   18.00 },
            { name: 'Antivirus License 1y',  sku: 'ATV-1YR', stock:  0, price:  149.00 },
            { name: 'Storage Box 10-slot',   sku: 'BOX-010', stock: 13, price:   39.00 },
            { name: 'Thermal Paste',         sku: 'PST-THR', stock: 45, price:   22.00 },
            { name: 'Cable Tie Pack 100x',   sku: 'TIE-100', stock: 80, price:   12.00 },
            { name: 'Laptop Bag 15"',        sku: 'BAG-LAP', stock: 19, price:  135.00 },
            { name: 'Power Strip 6-port',    sku: 'PWR-006', stock: 23, price:   65.00 },
            { name: 'UPS 700VA',             sku: 'UPS-700', stock:  4, price:  480.00 },
            { name: 'Fiber Patch Cable',     sku: 'CBL-FBR', stock: 10, price:  210.00 },
            { name: 'Network Switch 8-port', sku: 'NET-08P', stock:  6, price:  320.00 },
            { name: 'Wi-Fi Extender',        sku: 'WFI-EXT', stock: 14, price:  189.00 },
            { name: 'Smart Plug 4-pack',     sku: 'PLG-SM4', stock: 30, price:  119.00 },
            { name: 'CCTV Camera Dome',      sku: 'CAM-DOM', stock:  8, price:  299.00 },
            { name: 'Label Maker',           sku: 'LBL-MKR', stock:  5, price:  175.00 },
            { name: 'Barcode Scanner USB',   sku: 'BCO-USB', stock:  7, price:  245.00 },
            { name: 'Laptop Pro 15"',        sku: 'LAP-015', stock: 12, price: 4999.00 },
            { name: 'Wireless Mouse',        sku: 'MSE-001', stock: 34, price:  129.90 },
            { name: 'USB-C Hub 7-in-1',      sku: 'HUB-007', stock:  8, price:  349.00 },
            { name: 'Mechanical Keyboard',   sku: 'KBD-MEC', stock:  5, price:  599.00 },
            { name: 'Monitor 27" 4K',        sku: 'MON-27K', stock:  3, price: 3200.00 },
            { name: 'Webcam HD 1080p',       sku: 'CAM-HD1', stock: 20, price:  250.00 },
            { name: 'Headset Noise Cancel',  sku: 'HST-NC1', stock:  9, price:  799.00 },
            { name: 'External SSD 1TB',      sku: 'SSD-1TB', stock: 15, price:  689.00 },
            { name: 'Docking Station',       sku: 'DOK-001', stock:  6, price:  980.00 },
            { name: 'Desk Lamp LED',         sku: 'LMP-LED', stock: 25, price:   89.90 },
            { name: 'Laptop Stand',          sku: 'STD-LAP', stock: 18, price:  149.90 },
            { name: 'Mouse Pad XL',          sku: 'PAD-XL1', stock: 40, price:   49.90 },
            { name: 'HDMI Cable 2m',         sku: 'CBL-HD2', stock: 50, price:   35.00 },
            { name: 'USB 3.0 Hub 4-port',    sku: 'HUB-USG', stock: 22, price:   79.00 },
            { name: 'Thunderbolt Cable',     sku: 'CBL-TB3', stock: 11, price:  119.00 },
            { name: 'Smart Speaker',         sku: 'SPK-SMT', stock:  7, price:  399.00 },
            { name: 'Ergonomic Chair',       sku: 'CHR-ERG', stock:  2, price: 2100.00 },
            { name: 'Standing Desk',         sku: 'DSK-STD', stock:  1, price: 3800.00 },
            { name: 'Cable Organiser',       sku: 'ORG-CBL', stock: 30, price:   25.00 },
            { name: 'Wireless Charger',      sku: 'CHG-WRL', stock: 14, price:   99.00 },
            { name: 'NVMe SSD 500GB',        sku: 'NVM-05T', stock: 17, price:  420.00 },
            { name: 'RAM 16GB DDR5',         sku: 'RAM-16D', stock: 10, price:  380.00 },
            { name: 'Graphics Card RTX',     sku: 'GPU-RTX', stock:  4, price: 5200.00 },
            { name: 'CPU Intel i9',          sku: 'CPU-I9X', stock:  3, price: 4100.00 },
            { name: 'Motherboard ATX',       sku: 'MBD-ATX', stock:  5, price: 1580.00 },
            { name: 'Cooling Fan 120mm',     sku: 'FAN-12C', stock: 30, price:   65.00 },
            { name: 'PC Case Mid Tower',     sku: 'CAS-MDT', stock:  8, price:  320.00 },
            { name: 'Power Supply 750W',     sku: 'PSU-750', stock: 12, price:  450.00 },
            { name: 'Router Wi-Fi 6',        sku: 'RTR-WF6', stock:  9, price:  890.00 },
        ];

        const buffer = await this.pdfService.generateDocument({
            header: {
                title: 'Products Report',
                subtitle: `Generated on ${new Date().toLocaleDateString('pt-BR')} — ${products.length} items`,
            },
            table: {
                columns: [
                    { label: 'Product Name', key: 'name' },
                    { label: 'SKU',          key: 'sku',   width: 80 },
                    { label: 'Stock',  key: (r: any) => r.stock === 0 ? '! OUT' : String(r.stock), width: 55, align: 'center' },
                    { label: 'Price',  key: 'price', width: 100, type: 'currency' },
                ],
                rows: products,
            },
            footer: {
                text: 'Internal use only — Demo Store © 2026',
                showPageNumbers: true,
            },
        });

        this.sendPdf(res, buffer, 'sample-list.pdf');
    }

    /** Sample custom document — monthly sales summary report */
    @Get('custom')
    @ApiOperation({ summary: 'Download sample custom report (monthly sales summary)' })
    @ApiProduces('application/pdf')
    @ApiResponse({ status: 200, description: 'PDF file (custom report)', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
    async sampleCustom(@Res() res: Response) {
        const now = new Date();
        const month = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

        const metrics = [
            { label: 'Total Sales',    value: '147',         note: '+12% vs prev. month' },
            { label: 'Revenue',        value: 'R$ 48.320,00', note: '+8.4% vs prev. month' },
            { label: 'Avg Ticket',     value: 'R$ 328,70',   note: '-2.1% vs prev. month' },
            { label: 'New Customers',  value: '23',           note: '+5 vs prev. month'   },
            { label: 'Cancelled',      value: '4',            note: '2.7% cancellation rate' },
        ];

        const topProducts = [
            { rank: '1', name: 'Laptop Pro 15"',    qty: 22, revenue: 'R$ 109.978,00' },
            { rank: '2', name: 'Monitor 27" 4K',    qty: 18, revenue: 'R$  57.600,00' },
            { rank: '3', name: 'Mechanical KBD',    qty: 31, revenue: 'R$  18.569,00' },
            { rank: '4', name: 'Headset Noise Can.', qty: 15, revenue: 'R$  11.985,00' },
            { rank: '5', name: 'External SSD 1TB',  qty: 14, revenue: 'R$   9.646,00' },
        ];

        const buffer = await this.pdfService.generateDocument({
            header: {
                title: 'Monthly Sales Summary',
                subtitle: `Report for ${month} — Generated on ${now.toLocaleDateString('pt-BR')}`,
            },
            body: (doc) => {
                const L = 40;
                const pageW = doc.page.width - L * 2;
                const midW = (pageW - 10) / 2;

                // ── Section: Key Metrics ─────────────────────────────────────
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111')
                    .text('Key Metrics', L);
                doc.moveDown(0.4);

                let rowY = doc.y; // Y anchor for the current pair of cards
                metrics.forEach((m, i) => {
                    const col = i % 2;
                    // Capture row anchor at the start of every left card
                    if (col === 0) rowY = doc.y;
                    const x = L + col * (midW + 10);

                    // Card background
                    doc.save();
                    doc.rect(x, rowY, midW, 42).fill(col === 0 ? '#f0f4ff' : '#f0fff4').stroke('#dddddd');
                    doc.restore();

                    doc.fontSize(9).font('Helvetica').fillColor('#666666')
                        .text(m.label.toUpperCase(), x + 8, rowY + 6, { width: midW - 16 });
                    doc.fontSize(14).font('Helvetica-Bold').fillColor('#111111')
                        .text(m.value, x + 8, rowY + 18, { width: midW - 16 });
                    doc.fontSize(7).font('Helvetica').fillColor('#888888')
                        .text(m.note, x + 8, rowY + 33, { width: midW - 16 });

                    // Advance cursor only after the right card (end of row)
                    if (col === 1 || i === metrics.length - 1) {
                        doc.y = rowY + 50;
                    }
                });

                doc.moveDown(1.5);

                // ── Divider ──────────────────────────────────────────────────
                doc.moveTo(L, doc.y).lineTo(L + pageW, doc.y).strokeColor('#eeeeee').stroke();
                doc.moveDown(1);

                // ── Section: Top Products ─────────────────────────────────────
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111')
                    .text('Top 5 Products by Revenue', L);
                doc.moveDown(0.4);

                // Mini-table header
                const colW = [30, 0, 60, 100]; // rank, name (flex), qty, revenue
                const nameW = pageW - colW.reduce((a, b) => a + b, 0);
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#666666');
                const thY = doc.y; // fixed Y for entire header row
                let hx = L;
                ['#', 'Product', 'Qty', 'Revenue'].forEach((h, i) => {
                    const w = i === 1 ? nameW : colW[i];
                    doc.text(h, hx, thY, { width: w, align: i > 1 ? 'right' : 'left' });
                    hx += w;
                });
                doc.y = thY + 14;
                doc.moveDown(0.3);
                doc.moveTo(L, doc.y).lineTo(L + pageW, doc.y).dash(2, { space: 2 }).strokeColor('#cccccc').stroke().undash();
                doc.moveDown(0.3);

                // Mini-table rows
                doc.font('Helvetica').fillColor('#333333');
                topProducts.forEach((p, i) => {
                    const y = doc.y;
                    if (i % 2 === 0) {
                        doc.save().rect(L, y - 1, pageW, 14).fill('#fafafa').restore();
                    }
                    let rx = L;
                    [p.rank, p.name, String(p.qty), p.revenue].forEach((val, ci) => {
                        const w = ci === 1 ? nameW : colW[ci];
                        doc.fontSize(9).fillColor('#333333')
                            .text(val, rx, y, { width: w, align: ci > 1 ? 'right' : 'left' });
                        rx += w;
                    });
                    doc.y = y + 14;
                    doc.moveDown(0.2);
                });

                doc.moveDown(1.5);
                doc.moveTo(L, doc.y).lineTo(L + pageW, doc.y).strokeColor('#eeeeee').stroke();
                doc.moveDown(1);

                // ── Section: Notes ────────────────────────────────────────────
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Observations', L);
                doc.moveDown(0.4);
                doc.fontSize(10).font('Helvetica').fillColor('#444444');
                doc.text(
                    '• Sales of laptops and monitors continue to be the primary revenue drivers.\n' +
                    '• Average ticket declined slightly due to promotional campaign on accessories.\n' +
                    '• Cancellation rate remains within the acceptable threshold (< 5%).\n' +
                    '• 4 pending support tickets related to delayed shipments in the North region.',
                    L, doc.y, { width: pageW, lineGap: 4 },
                );

                doc.moveDown(2);

                // ── Signature ─────────────────────────────────────────────────
                doc.fontSize(9).font('Helvetica').fillColor('#888888');
                doc.moveTo(L, doc.y).lineTo(L + 180, doc.y).strokeColor('#aaaaaa').stroke();
                doc.text('Manager Signature', L, doc.y + 4, { width: 180, align: 'center' });
            },
            footer: {
                text: `Monthly Sales Report — ${month} — Confidential`,
                showPageNumbers: true,
            },
        });

        this.sendPdf(res, buffer, `sales-summary-${now.toISOString().slice(0, 7)}.pdf`);
    }

    private sendPdf(res: Response, buffer: Buffer, filename: string): void {
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}
