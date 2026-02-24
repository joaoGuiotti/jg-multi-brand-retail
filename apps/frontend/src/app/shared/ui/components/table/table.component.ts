import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { UiNumberPipe } from '../../pipes/number.pipe';
import { UiLoadingComponent } from '../loading/loading.component';
import { RowExpandConfig, SortDirection, TableColumn, TableConfig, TableSort } from './models/table.types';

@Component({
    selector: 'ui-table',
    standalone: true,
    imports: [CommonModule, UiNumberPipe, UiLoadingComponent],
    templateUrl: './table.component.html',
    styleUrl: './table.component.scss'
})
export class UiTableComponent<T = any> {
    // Signal Inputs
    columns = input.required<TableColumn<T>[]>();
    dataSource = input.required<T[]>();
    config = input<TableConfig>({
        stripedRow: true,
        scrollable: false,
        resizable: false,
        expandable: false,
        dragColumn: false
    });
    rowExpandConfig = input<RowExpandConfig<T>>();

    // Outputs
    rowClick = output<T>();
    cellClick = output<{ row: T; column: TableColumn<T> }>();
    pageChange = output<number>();
    sortChange = output<TableSort>();

    // Expose Math to template
    protected readonly Math = Math;

    // Internal State Signals
    private expandedRowsSet = signal<Set<T>>(new Set());
    currentSort = signal<TableSort | null>(null);

    // Computed Values
    sortedData = computed(() => {
        const data = this.dataSource();
        const sort = this.currentSort();

        // If backend pagination is enabled, we assume the sorting is also backend-driven
        // or handled externally. We only sort locally if pagination is disabled or 
        // if the user specifically expects the component to handle it.
        if (!sort || sort.direction === 'none' || this.config().pagination?.enabled) {
            return data;
        }

        return [...data].sort((a, b) => {
            const valA = (a as any)[sort.column];
            const valB = (b as any)[sort.column];

            if (valA === valB) return 0;

            const multiplier = sort.direction === 'asc' ? 1 : -1;
            return valA > valB ? multiplier : -multiplier;
        });
    });

    // Computed Values for Pagination
    totalPages = computed(() => {
        const p = this.config().pagination;
        if (!p?.enabled || !p.totalItems || !p.pageSize) return 1;
        return Math.ceil(p.totalItems / p.pageSize);
    });

    pageNumbers = computed(() => {
        const pages: number[] = [];
        const maxVisible = 5;
        const current = this.config().pagination?.currentPage || 1;
        const total = this.totalPages();

        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    });

    isAnyRowExpanded = computed(() => this.expandedRowsSet().size > 0);

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.pageChange.emit(page);
        }
    }

    nextPage(): void {
        const current = this.config().pagination?.currentPage || 1;
        this.goToPage(current + 1);
    }

    previousPage(): void {
        const current = this.config().pagination?.currentPage || 1;
        this.goToPage(current - 1);
    }

    toggleRow(row: T): void {
        const currentSet = new Set(this.expandedRowsSet());
        if (currentSet.has(row)) {
            currentSet.delete(row);
        } else {
            currentSet.add(row);
        }
        this.expandedRowsSet.set(currentSet);
    }

    isRowExpanded(row: T): boolean {
        return this.expandedRowsSet().has(row);
    }

    onRowClick(row: T): void {
        if (this.config().expandable) {
            this.toggleRow(row);
        }
        this.rowClick.emit(row);
    }

    onCellClick(event: MouseEvent, row: T, column: TableColumn<T>): void {
        event.stopPropagation();
        this.cellClick.emit({ row, column });
    }

    onColumnSort(column: TableColumn<T>): void {
        const isSortable = this.config().sortable || column.sortable;
        if (!isSortable) return;

        const current = this.currentSort();
        let direction: SortDirection = 'asc';

        if (current && current.column === column.key) {
            if (current.direction === 'asc') direction = 'desc';
            else if (current.direction === 'desc') direction = 'none';
            else direction = 'asc';
        }

        const newSort = { column: column.key, direction };
        this.currentSort.set(direction === 'none' ? null : newSort);
        this.sortChange.emit(newSort);
    }

    getValue(row: T, key: string): any {
        return (row as any)[key];
    }

    trackByRow(index: number, row: T): any {
        const key = this.config()?.rowIdKey;
        if (key && (row as any)[key] !== undefined) {
            return (row as any)[key];
        }
        return (row as any).id ?? row;
    }
}
