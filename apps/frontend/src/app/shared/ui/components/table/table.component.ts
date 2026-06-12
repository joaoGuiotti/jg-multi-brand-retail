import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDragPreview, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Component, computed, ContentChildren, EventEmitter, input, Output, QueryList, signal, ChangeDetectionStrategy } from '@angular/core';
import { UiNumberPipe } from '../../pipes/number.pipe';
import { UiLoadingComponent } from '../loading/loading.component';
import { UiPaginationComponent } from '../pagination/pagination.component';
import { UiTableColumnDirective } from './directives/table-column.directive';
import { RowExpandConfig, SortDirection, TableColumn, TableConfig, TableSort } from './models/table.types';

@Component({
    selector: 'ui-table',
    standalone: true,
    imports: [CommonModule, NgComponentOutlet, NgTemplateOutlet, UiNumberPipe, UiLoadingComponent, UiPaginationComponent, CdkDropList, CdkDrag, CdkDragPreview, CdkDragPlaceholder, CdkDragHandle],
    templateUrl: './table.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './table.component.scss'
})
export class UiTableComponent<T = any> {
    // Signal Inputs
    columns = input<TableColumn<T>[]>([]);
    dataSource = input.required<T[]>();

    // Content Children for declarative columns
    @ContentChildren(UiTableColumnDirective) declarativeColumns!: QueryList<UiTableColumnDirective<T>>;

    config = input<TableConfig>({
        stripedRow: true,
        scrollable: false,
        resizable: false,
        expandable: false,
        dragColumn: false
    });
    rowExpandConfig = input<RowExpandConfig<T>>();

    // Internal State Signals
    private expandedRowsSet = signal<Set<T>>(new Set());
    private reorderedColumnKeys = signal<string[] | null>(null);
    currentSort = signal<TableSort | null>(null);

    // Computed internal columns
    effectiveColumns = computed<TableColumn<T>[]>(() => {
        const inputCols = this.columns();
        const declarativeCols = this.declarativeColumns?.toArray() || [];

        let baseColumns: TableColumn<T>[] = [];

        // If columns are provided via input, use them as the structural definition
        if (inputCols.length > 0) {
            baseColumns = inputCols.map(col => {
                const declarative = declarativeCols.find(d => d.key() === col.key);
                const template = declarative?.template || col.cellTemplate;
                return {
                    ...col,
                    draggable: col.draggable ?? true,
                    // Prioritize declarative template if found
                    cellTemplate: template,
                    // Force type to 'template' if we have a template to render
                    type: template ? 'template' : col.type
                };
            });
        } else {
            // Fallback: if no input columns, use declarative columns as definitions
            baseColumns = declarativeCols.map(col => ({
                key: col.key(),
                label: '', // Label must come from input or be empty
                cellTemplate: col.template,
                type: 'template',
                draggable: true
            }));
        }

        const reorderedKeys = this.reorderedColumnKeys();
        if (!reorderedKeys) return baseColumns;

        // Map reordered keys back to column definitions, ensuring we don't lose any new columns
        const reorderedCols = reorderedKeys
            .map(key => baseColumns.find(c => c.key === key))
            .filter((c): c is TableColumn<T> => !!c);

        // Append any columns that weren't in the reordered list (e.g. newly added columns)
        const missingCols = baseColumns.filter(c => !reorderedKeys.includes(c.key));

        return [...reorderedCols, ...missingCols];
    });

    // Outputs
    @Output() rowClick = new EventEmitter<T>();
    @Output() cellClick = new EventEmitter<{ row: T; column: TableColumn<T> }>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() sortChange = new EventEmitter<TableSort>();

    // Expose Math to template
    protected readonly Math = Math;

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
            const valA = this.resolveKey(a, sort.column);
            const valB = this.resolveKey(b, sort.column);

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            const multiplier = sort.direction === 'asc' ? 1 : -1;
            return valA > valB ? multiplier : -multiplier;
        });
    });

    isAnyRowExpanded = computed(() => this.expandedRowsSet().size > 0);

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
        const isSortable = column.sortable ?? this.config().sortable;
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

    onColumnDrop(event: CdkDragDrop<string[]>): void {
        const columns = this.effectiveColumns();
        const keys = columns.map(c => c.key);
        moveItemInArray(keys, event.previousIndex, event.currentIndex);
        this.reorderedColumnKeys.set(keys);
    }

    getValue(row: T, key: string): any {
        return this.resolveKey(row, key);
    }

    private resolveKey(obj: any, path: string): any {
        if (!path || !obj) return undefined;
        if (!path.includes('.')) return obj[path];

        return path.split('.').reduce((acc, part) => {
            return acc && acc[part] !== undefined ? acc[part] : undefined;
        }, obj);
    }

    trackByRow(index: number, row: T): any {
        const key = this.config()?.rowIdKey;
        if (key && (row as any)[key] !== undefined) {
            return (row as any)[key];
        }
        return (row as any).id ?? row;
    }

    getComponentInputs(row: T, column: TableColumn<T>): Record<string, any> {
        return {
            row,
            column,
            value: this.resolveKey(row, column.key),
            ...(column.cellComponentInputs || {})
        };
    }

    onCellAction(event: any, row: T, column: TableColumn<T>): void {
        // Handle common action output
        if (column.cellComponentOutputs?.['action']) {
            column.cellComponentOutputs['action'](event);
        }
        // Also emit a general event if needed
    }
}
