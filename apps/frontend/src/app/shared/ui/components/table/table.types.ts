import { TemplateRef, Type } from '@angular/core';

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'component' | 'template';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface TableSort {
    column: string;
    direction: SortDirection;
}

export interface TableColumn<T = any> {
    key: string;
    label: string;
    type?: ColumnType;
    width?: string;
    cellTemplate?: TemplateRef<any>;
    cellComponent?: Type<any>;
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
