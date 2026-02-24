import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, effect, signal, TemplateRef, ViewChild } from '@angular/core';
import {
  BadgeVariant,
  RowExpandConfig,
  TableColumn,
  TableConfig,
  TableSort,
  ThemeToggleComponent,
  UiBadgeComponent,
  UiCardComponent,
  UiTableComponent
} from '@shared/ui';

@Component({
  standalone: true,
  imports: [UiBadgeComponent],
  template: `
    <ui-badge [variant]="variant()">{{ row().status }}</ui-badge>
  `
})
export class StatusBadgeComponent {
  row = input.required<any>();
  column = input<any>();
  variant = computed<BadgeVariant>(() => {
    const status = this.row()?.status;
    if (status === 'Active') return 'success';
    if (status === 'Inactive') return 'error';
    return 'warning';
  });
}

// Stub for input since it's used decorator-style in component class
import { input } from '@angular/core';

@Component({
  selector: 'app-table-demo',
  standalone: true,
  imports: [CommonModule, UiTableComponent, UiCardComponent, ThemeToggleComponent],
  template: `
    <div class="flex justify-end p-4">
      <ui-theme-toggle />
    </div>

    <div class="p-6 space-y-8 max-w-7xl mx-auto bg-surface">
      <h1 class="text-3xl font-bold text-content">Table Component Demo</h1>

      <ui-card padding="md">
        <h2 class="text-xl font-semibold mb-4 text-content">Complete Demo (Signals, Defer, Expansion, Pagination)</h2>
        <div class="min-h-[400px]">
          <ui-table 
            [columns]="columns()" 
            [dataSource]="pagedData()" 
            [config]="tableConfig()"
            [rowExpandConfig]="expandConfig()"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)"
            (rowClick)="onRowClick($event)">
          
          <!-- Custom template for name column -->
          <ng-template #nameTemplate let-row>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {{ row.name.charAt(row.name.length - 1) }}
              </div>
              <span class="font-medium text-content">{{ row.name }}</span>
            </div>
          </ng-template>

          <!-- Row Expansion Template -->
          <ng-template #expandTemplate let-row>
            <div class="p-4 bg-surface-secondary/50 rounded-lg border border-outline">
              <h4 class="font-bold mb-2 text-content">Detailed Information for {{ row.name }}</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-3 bg-surface rounded shadow-sm border border-outline">
                  <p class="text-xs text-content-secondary uppercase font-semibold">SKU</p>
                  <p class="text-sm font-medium">{{ row.sku }}</p>
                </div>
                <div class="p-3 bg-surface rounded shadow-sm border border-outline">
                  <p class="text-xs text-content-secondary uppercase font-semibold">Category</p>
                  <p class="text-sm font-medium">{{ row.category }}</p>
                </div>
                <div class="p-3 bg-surface rounded shadow-sm border border-outline">
                  <p class="text-xs text-content-secondary uppercase font-semibold">ID</p>
                  <p class="text-sm font-medium">#{{ row.id }}</p>
                </div>
              </div>
            </div>
          </ng-template>
        </ui-table>
      </div>
    </ui-card>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ui-card padding="md">
          <h2 class="text-xl font-semibold mb-4 text-content">Striped Table</h2>
          <ui-table 
            [columns]="simpleColumns" 
            [dataSource]="simpleData" 
            [config]="{ stripedRow: true, sortable: true }">
          </ui-table>
        </ui-card>

        <ui-card padding="md">
          <h2 class="text-xl font-semibold mb-4 text-content">Scrollable Table</h2>
          <div class="h-64 border border-outline rounded overflow-hidden">
            <ui-table 
              [columns]="simpleColumns" 
              [dataSource]="allData" 
              [config]="{ scrollable: true, stripedRow: true, sortable: true }">
            </ui-table>
          </div>
        </ui-card>
      </div>
    </div>
  `
})
export class TableDemoComponent implements AfterViewInit {
  @ViewChild('nameTemplate', { static: true }) nameTmpl!: TemplateRef<any>;
  @ViewChild('expandTemplate', { static: true }) expandTmpl!: TemplateRef<any>;

  // Mock Data
  allData = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    sku: `SKU-${1000 + i}`,
    price: 50 + (Math.random() * 500),
    date: new Date(2023, Math.floor(Math.random() * i % 12), Math.floor(Math.random() * 28)),
    status: i % 4 === 0 ? 'Active' : (i % 4 === 1 ? 'Inactive' : 'Pending'),
    category: i % 2 === 0 ? 'Hardware' : 'Software'
  }));

  // Signals for state
  currentPage = signal(1);
  pageSize = 5;
  loading = signal(false);
  pagedData = signal<any[]>([]);
  currentSort = signal<TableSort | null>(null);

  constructor() {
    effect(() => {
      // Re-fetch when page or sort changes
      this.fetchData(this.currentPage(), this.currentSort());
    });
  }

  private fetchData(page: number, sort: TableSort | null) {
    this.loading.set(true);
    // Simulating network delay
    setTimeout(() => {
      let data = [...this.allData];

      // Backend sorting simulation
      if (sort && sort.direction !== 'none') {
        data.sort((a, b) => {
          const valA = (a as any)[sort.column];
          const valB = (b as any)[sort.column];
          if (valA === valB) return 0;
          const div = sort.direction === 'asc' ? 1 : -1;
          return valA > valB ? div : -div;
        });
      }

      const start = (page - 1) * this.pageSize;
      this.pagedData.set(data.slice(start, start + this.pageSize));
      this.loading.set(false);
    }, 500);
  }

  columns = signal<TableColumn[]>([]);
  expandConfig = signal<RowExpandConfig>({});

  tableConfig = computed<TableConfig>(() => ({
    stripedRow: true,
    expandable: true,
    sortable: true,
    pagination: {
      enabled: true,
      pageSize: this.pageSize,
      totalItems: this.allData.length,
      currentPage: this.currentPage()
    },
    loading: this.loading(),
    rowIdKey: 'id'
  }));

  simpleColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price', type: 'currency' }
  ];

  simpleData = this.allData.slice(0, 5);

  ngAfterViewInit() {
    // Timeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.columns.set([
        { key: 'id', label: 'ID', type: 'text', width: '60px' },
        { key: 'name', label: 'Product Name', type: 'template', cellTemplate: this.nameTmpl },
        { key: 'price', label: 'Unit Price', type: 'currency' },
        { key: 'status', label: 'Stock Status', type: 'component', cellComponent: StatusBadgeComponent },
        { key: 'date', label: 'Last Updated', type: 'date' },
      ]);

      this.expandConfig.set({
        template: this.expandTmpl
      });
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onSortChange(sort: TableSort) {
    this.currentSort.set(sort);
  }

  onRowClick(row: any) {
    console.log('Row clicked:', row);
  }
}
