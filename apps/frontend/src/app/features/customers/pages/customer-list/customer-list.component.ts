
import { Component, computed, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TableColumn, TableConfig, TableSort, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiDocumentPipe, UiInputFieldComponent, UiPhonePipe, UiTableColumnDirective, UiTableComponent, UiHasRoleDirective, UiPageHeaderComponent } from '@shared/ui';
import { Customer, CustomerFilter, CustomerListResponse } from '../../../../core/models/customer.model';
import { CustomersService } from '../../../../core/services/customers.service';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [RouterModule, FormsModule, UiButtonComponent, UiCardComponent, UiBadgeComponent, UiTableComponent, UiTableColumnDirective, UiDocumentPipe, UiPhonePipe, UiInputFieldComponent, UiHasRoleDirective, UiPageHeaderComponent],
    templateUrl: './customer-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {

    customers = signal<Customer[]>([]);
    isLoading = signal(false);
    errorMessage = signal('');

    // Pagination
    currentPage = signal(1);
    totalItems = signal(0);
    pageSize = 10;

    // Filters
    searchTerm = '';
    showActiveOnly = true;
    currentSort = signal<TableSort | null>(null);

    columns = signal<TableColumn[]>([
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'document', label: 'Document' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'isActive', label: 'Status' },
        { key: 'actions', label: 'Actions', width: '150px', sortable: false }
    ]);

    tableConfig = computed<TableConfig>(() => ({
        stripedRow: true,
        loading: this.isLoading(),
        sortable: true,
        pagination: {
            enabled: true,
            pageSize: this.pageSize,
            totalItems: this.totalItems(),
            currentPage: this.currentPage()
        },
        rowIdKey: 'id'
    }));

    constructor(
        private customersService: CustomersService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadCustomers();
    }

    loadCustomers(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        const filter: CustomerFilter = {
            search: this.searchTerm || undefined,
            isActive: this.showActiveOnly,
            sortBy: this.currentSort()?.column as string,
            sortOrder: this.currentSort()?.direction as 'asc' | 'desc'
        };

        this.customersService.getCustomers(this.currentPage(), this.pageSize, filter).subscribe({
            next: (response: CustomerListResponse) => {
                const { meta, data } = response;
                this.customers.set(data);
                this.totalItems.set(meta?.total!);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set(error.error?.message || 'Failed to load customers');
                this.isLoading.set(false);
            }
        });
    }

    onSearch(): void {
        this.currentPage.set(1);
        this.loadCustomers();
    }

    onFilterChange(): void {
        this.currentPage.set(1);
        this.loadCustomers();
    }

    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadCustomers();
    }

    onSortChange(sort: TableSort): void {
        this.currentSort.set(sort.direction === 'none' ? null : sort);
        this.loadCustomers();
    }

    editCustomer(id: string): void {
        this.router.navigate(['/customers', id, 'edit']);
    }

    deleteCustomer(id: string): void {
        console.log('Delete customer called for ID:', id);
        if (window.confirm('Are you sure you want to delete this customer?')) {
            console.log('Deletion confirmed for ID:', id);
            this.customersService.deleteCustomer(id).subscribe({
                next: () => {
                    console.log('Deletion successful');
                    this.loadCustomers();
                },
                error: (error) => {
                    console.error('Deletion failed:', error);
                    this.errorMessage.set(error.error?.message || 'Failed to delete customer');
                }
            });
        } else {
            console.log('Deletion cancelled by user');
        }
    }
}
