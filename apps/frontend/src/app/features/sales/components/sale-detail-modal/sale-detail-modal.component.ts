import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MODAL_DATA, MODAL_REF, ModalRef, TableColumn, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiNumberPipe, UiTableColumnDirective, UiTableComponent } from '@shared/ui';
import { finalize } from 'rxjs';
import { Sale } from '../../../../core/models/sale.model';
import { SalesService } from '../../../../core/services/sales.service';

@Component({
    selector: 'app-sale-detail-modal',
    standalone: true,
    imports: [
        CommonModule,
        UiButtonComponent,
        UiBadgeComponent,
        UiCardComponent,
        UiTableComponent,
        UiTableColumnDirective,
        UiNumberPipe
    ],
    templateUrl: './sale-detail-modal.component.html',
})
export class SaleDetailModalComponent implements OnInit {
    private modalRef = inject(MODAL_REF) as ModalRef<void>;
    readonly saleId = inject(MODAL_DATA) as string;
    private salesService = inject(SalesService);
    private router = inject(Router);

    sale = signal<Sale | null>(null);
    isLoading = signal(true);
    errorMessage = signal('');

    onPrint(): void {
        const sale = this.sale();
        if (!sale) return;

        this.salesService.getReceipt(sale.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt-${sale.invoiceNumber || sale.id}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                this.errorMessage.set('Failed to download receipt');
            }
        });
    }

    columns: TableColumn[] = [
        { key: 'product.name', label: 'Product', sortable: true },
        { key: 'quantity', label: 'Qty', width: '80px', sortable: true },
        { key: 'unitPrice', label: 'Unit Price', type: 'currency', width: '120px', sortable: true },
        { key: 'total', label: 'Total', type: 'currency', width: '120px', sortable: true }
    ];

    ngOnInit(): void {
        this.loadSaleDetails();
    }

    loadSaleDetails(): void {
        this.isLoading.set(true);
        this.salesService.getSale(this.saleId)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.sale.set(response.data);
                },
                error: (error) => {
                    this.errorMessage.set(error.error?.message || 'Failed to load sale details');
                }
            });
    }

    close(): void {
        this.modalRef.close();
    }

    hasPendingReturns(): boolean {
        const sale = this.sale();
        if (!sale || !sale.returns) return false;
        return sale.returns.some(r => ['REQUESTED', 'APPROVED'].includes(r.status));
    }

    initiateReturn(): void {
        const sale = this.sale();
        if (!sale) return;
        this.close();
        this.router.navigate(['/returns/new'], { queryParams: { saleId: sale.id } });
    }

    getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'PENDING': return 'warning';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    }
}
