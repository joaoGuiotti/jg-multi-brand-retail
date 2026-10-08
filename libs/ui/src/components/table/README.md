# UiTableComponent

A powerful, high-performance Angular table component powered by Signals and the new control flow.

## Features
- 🚀 **Performance-First**: Uses Angular Signals and `@defer` for lazy rendering.
- 🔄 **Sorting**: Built-in support for local sorting and backend-driven sort events.
- 📄 **Pagination**: Seamless integration for both local and remote pagination.
- ⏳ **Loading State**: Native overlay support with `UiLoadingComponent`.
- 🧩 **Custom Cells**: Render components or templates with a simple declarative API.
- ↕️ **Row Expansion**: Support for master-detail views via templates or components.
- 🎨 **Modern UI**: Clean, responsive design with support for theme toggling.

## Installation

Import the component and its types:

```typescript
import { 
  UiTableComponent, 
  UiTableColumnDirective, 
  TableCellBase,
  TableColumn, 
  TableConfig, 
  TableSort 
} from '@shared/ui';
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
```

## Declarative Columns

The table supports a powerful structural directive `*uiTableColumn` to define custom cell templates directly in your HTML. The `columns` input remains the source of truth for the table structure (labels, order, width), while the directive provides the rendering logic.

```html
<ui-table [columns]="columns" [dataSource]="data">
  <!-- ID Column Customization -->
  <div *uiTableColumn="'id'; let row">
    <span class="font-mono text-primary">#{{ row.id }}</span>
  </div>

  <!-- Name Column with custom content -->
  <div *uiTableColumn="'name'; let row">
    <div class="font-bold text-content">{{ row.name }}</div>
    <div class="text-xs text-content-secondary">{{ row.sku }}</div>
  </div>
</ui-table>
```

## Custom Cell Components

For complex cell logic, you can use standalone components. All cell components should extend `TableCellBase` to inherit standard inputs and types.

### 1. Create the Cell Component

```typescript
import { Component, computed } from '@angular/core';
import { TableCellBase, UiBadgeComponent } from '@shared/ui';

@Component({
  standalone: true,
  imports: [UiBadgeComponent],
  template: `<ui-badge [variant]="variant()">{{ value() }}</ui-badge>`
})
export class StatusBadgeComponent extends TableCellBase<any, string> {
  variant = computed(() => this.value() === 'Active' ? 'success' : 'error');
}
```

### 2. Register in Column Definition

```typescript
columns: TableColumn[] = [
  { 
    key: 'status', 
    label: 'Status', 
    type: 'component', 
    cellComponent: StatusBadgeComponent,
    // Optional: Pass custom inputs to your component
    cellComponentInputs: { showIcon: true },
    // Optional: Handle component outputs
    cellComponentOutputs: { 
      action: (event) => console.log('Action triggered!', event) 
    }
  }
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
| `pagination` | `object` | Configuration for pagination. |

## API Summary

### Inputs
- `columns`: `TableColumn[]` - Source of truth for column metadata.
- `dataSource`: `T[]` - Array of objects to render.
- `config`: `TableConfig` - Global table behavior.
- `rowExpandConfig`: `RowExpandConfig` - Configuration for detail rows.

### Outputs
- `rowClick`: `EventEmitter<T>` - Emits the clicked row data.
- `cellClick`: `EventEmitter<{ row: T, column: TableColumn }>` - Emits cell data.
- `pageChange`: `EventEmitter<number>` - Emits the new page number.
- `sortChange`: `EventEmitter<TableSort>` - Emits the new sort state.

### Directives
- `*uiTableColumn="'key'"`: Structural directive for custom cell templates. Context: `{ $implicit: row, row: row, column: column }`.

