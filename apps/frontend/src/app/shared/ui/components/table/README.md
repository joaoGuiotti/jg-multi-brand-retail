# UiTableComponent

A powerful, high-performance Angular table component powered by Signals and the new control flow.

## Features
- 🚀 **Performance-First**: Uses Angular Signals and `@defer` for lazy rendering.
- 🔄 **Sorting**: Built-in support for local sorting and backend-driven sort events.
- 📄 **Pagination**: Seamless integration for both local and remote pagination.
- ⏳ **Loading State**: Native overlay support with `UiLoadingComponent`.
- 🧩 **Custom Cells**: Render components or templates inside specific cells.
- ↕️ **Row Expansion**: Support for master-detail views via templates or components.
- 🎨 **Modern UI**: Clean, responsive design with support for theme toggling.

## Installation

Import the component and its types:

```typescript
import { UiTableComponent, TableColumn, TableConfig, TableSort } from '@shared/ui';
```

## Basic Usage

```html
<ui-table 
  [columns]="columns" 
  [dataSource]="data">
</ui-table>
```

```typescript
columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Product Name' },
  { key: 'price', label: 'Price', type: 'currency' }
];

data = [
  { id: 1, name: 'Product A', price: 100 },
  { id: 2, name: 'Product B', price: 200 }
];
```

## Configuration Options (`TableConfig`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `sortable` | `boolean` | Enable sorting globally. |
| `loading` | `boolean` | Show the loading overlay. |
| `stripedRow` | `boolean` | Alternate row background colors. |
| `scrollable` | `boolean` | Enable horizontal scrolling. |
| `expandable` | `boolean` | Enable row expansion. |
| `rowIdKey` | `string` | Custom key for row tracking (improves performance). |
| `pagination` | `object` | Configuration for pagination (see below). |

### Pagination Configuration
```typescript
pagination: {
  enabled: boolean;
  pageSize: number;
  totalItems: number;
  currentPage: number;
}
```

## Advanced Features

### Sorting
Sorting can be enabled globally in `config` or per-column.
- **Local**: If `pagination.enabled` is `false`, the table sorts the data automatically.
- **Remote**: Emits `(sortChange)` whenever a sortable header is clicked.

```html
<ui-table 
  [config]="{ sortable: true }"
  (sortChange)="onSort($event)">
</ui-table>
```

### Backend Integration Example

Use signals and effects to handle remote sorting and pagination efficiently.

```typescript
@Component({
  template: `
    <ui-table 
      [columns]="columns" 
      [dataSource]="data()" 
      [config]="tableConfig()"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSortChange($event)">
    </ui-table>
  `
})
export class ProductListComponent {
  private productService = inject(ProductService);
  
  // State
  data = signal<Product[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  currentSort = signal<TableSort | null>(null);
  loading = signal(false);

  // Configuration
  tableConfig = computed<TableConfig>(() => ({
    sortable: true,
    loading: this.loading(),
    pagination: {
      enabled: true,
      pageSize: 10,
      totalItems: this.totalItems(),
      currentPage: this.currentPage()
    }
  }));

  constructor() {
    // Automatically re-fetch when page or sort changes
    effect(() => {
      this.loadData(this.currentPage(), this.currentSort());
    });
  }

  async loadData(page: number, sort: TableSort | null) {
    this.loading.set(true);
    const result = await this.productService.list({ 
      page, 
      sortBy: sort?.column, 
      order: sort?.direction 
    });
    this.data.set(result.items);
    this.totalItems.set(result.total);
    this.loading.set(false);
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onSortChange(sort: TableSort) {
    this.currentSort.set(sort);
  }
}
```

### Custom Cell Rendering
You can pass an Angular component or a `TemplateRef` to a column definition.

```typescript
{ 
  key: 'status', 
  label: 'Status', 
  type: 'component', 
  cellComponent: StatusBadgeComponent 
}
```

## API Summary

### Inputs
- `columns`: `TableColumn[]` (Required)
- `dataSource`: `T[]` (Required)
- `config`: `TableConfig`
- `rowExpandConfig`: `RowExpandConfig`

### Outputs
- `rowClick`: Emits the clicked row data.
- `cellClick`: Emits `{ row, column }`.
- `pageChange`: Emits the new page number.
- `sortChange`: Emits the new `TableSort` state.
