import { Directive, input, output, TemplateRef, Type } from '@angular/core';

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'component' | 'template';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface TableSort {
    column: string;
    direction: SortDirection;
}

@Directive()
export abstract class TableCellBase<T = any, V = any> {
    row = input.required<T>();
    column = input.required<TableColumn<T>>();
    value = input.required<V>();

    // Standard event for cell components
    action = output<any>();
}

export interface TableColumn<T = any> {
    key: string;
    label: string;
    type?: ColumnType;
    width?: string;
    cellTemplate?: TemplateRef<any>;
    cellComponent?: Type<TableCellBase<T, any>>;
    cellComponentInputs?: Record<string, any>;
    cellComponentOutputs?: Record<string, (event: any) => void>;
    sortable?: boolean;
    headerClass?: string;
    cellClass?: string;
    resizable?: boolean;
    formatOptions?: {
        currencyCode?: string;
        dateFormat?: string;
        decimalPlaces?: number;
        prefix?: string;
        suffix?: string;
        [key: string]: any;
    };
}

export interface TableConfig {
    scrollable?: boolean;
    resizable?: boolean;
    expandable?: boolean;
    dragColumn?: boolean;
    stripedRow?: boolean;
    loading?: boolean;
    sortable?: boolean;
    pagination?: {
        enabled?: boolean;
        pageSize?: number;
        totalItems?: number;
        currentPage?: number;
    };
    rowIdKey?: string;
}

export interface RowExpandConfig<T = any> {
    template?: TemplateRef<any>;
    component?: Type<any>;
}
