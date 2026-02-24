import { Component, input } from '@angular/core';
import { ComponentFixture, DeferBlockState, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UiTableComponent } from './table.component';
import { TableColumn } from './table.types';

@Component({
    standalone: true,
    template: `<div class="ui-custom-cell">Custom Component: {{ row().name }}</div>`
})
class TestCellComponent {
    row = input.required<any>();
    column = input<any>();
}

describe('UiTableComponent', () => {
    let component: UiTableComponent;
    let fixture: ComponentFixture<UiTableComponent>;

    const mockData = [
        { id: 1, name: 'Product A', price: 100, date: new Date(2023, 0, 1) },
        { id: 2, name: 'Product B', price: 200, date: new Date(2023, 0, 2) },
    ];

    const mockColumns: TableColumn[] = [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'price', label: 'Price', type: 'currency' },
        { key: 'date', label: 'Date', type: 'date' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiTableComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiTableComponent);
        component = fixture.componentInstance;

        // Set required inputs
        fixture.componentRef.setInput('columns', mockColumns);
        fixture.componentRef.setInput('dataSource', mockData);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render correct number of rows', () => {
        const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
        // Since we don't have expansion yet, it should be same as mockData length
        expect(rows.length).toBe(mockData.length);
    });

    it('should render column labels in header', () => {
        const headers = fixture.debugElement.queryAll(By.css('thead th'));
        expect(headers[0].nativeElement.textContent).toContain('Name');
        expect(headers[1].nativeElement.textContent).toContain('Price');
    });

    it('should format currency correctly', () => {
        const priceCell = fixture.debugElement.queryAll(By.css('tbody td'))[1];
        // Default prefix is R$
        expect(priceCell.nativeElement.textContent.trim()).toContain('R$');
    });

    it('should toggle row expansion', () => {
        fixture.componentRef.setInput('config', { expandable: true });
        fixture.detectChanges();

        const row = fixture.debugElement.query(By.css('tbody tr'));
        row.nativeElement.click();
        fixture.detectChanges();

        expect(component.isRowExpanded(mockData[0])).toBeTrue();

        const expandedRow = fixture.debugElement.query(By.css('.ui-expanded-row'));
        expect(expandedRow).toBeTruthy();
    });

    it('should render custom component in cell', async () => {
        const columnsWithComponent: TableColumn[] = [
            { key: 'name', label: 'Name', type: 'component', cellComponent: TestCellComponent }
        ];
        fixture.componentRef.setInput('columns', columnsWithComponent);
        fixture.detectChanges();

        // Trigger defer block
        const deferBlocks = await fixture.getDeferBlocks();
        await deferBlocks[0].render(DeferBlockState.Complete);
        fixture.detectChanges();

        const customCell = fixture.debugElement.query(By.css('.ui-custom-cell'));
        expect(customCell).toBeTruthy();
        expect(customCell.nativeElement.textContent).toContain('Product A');
    });

    it('should emit rowClick event', () => {
        spyOn(component.rowClick, 'emit');
        const row = fixture.debugElement.query(By.css('tbody tr'));
        row.nativeElement.click();
        expect(component.rowClick.emit).toHaveBeenCalledWith(mockData[0]);
    });

    it('should render pagination when enabled', () => {
        fixture.componentRef.setInput('config', {
            pagination: {
                enabled: true,
                pageSize: 1,
                totalItems: 2,
                currentPage: 1
            }
        });
        fixture.detectChanges();

        const paginationContainer = fixture.debugElement.query(By.css('.bg-surface-secondary.px-6.py-3'));
        expect(paginationContainer).toBeTruthy();

        const pageButtons = fixture.debugElement.queryAll(By.css('button'));
        // Previous + Page 1 + Page 2 + Next = 4 buttons
        expect(pageButtons.length).toBe(4);
    });

    it('should emit pageChange when clicking page button', () => {
        spyOn(component.pageChange, 'emit');
        fixture.componentRef.setInput('config', {
            pagination: {
                enabled: true,
                pageSize: 1,
                totalItems: 2,
                currentPage: 1
            }
        });
        fixture.detectChanges();

        const page2Button = fixture.debugElement.queryAll(By.css('button'))[2]; // Page 2 button
        page2Button.nativeElement.click();

        expect(component.pageChange.emit).toHaveBeenCalledWith(2);
    });

    it('should disable previous button on first page', () => {
        fixture.componentRef.setInput('config', {
            pagination: {
                enabled: true,
                pageSize: 1,
                totalItems: 2,
                currentPage: 1
            }
        });
        fixture.detectChanges();

        const prevButton = fixture.debugElement.queryAll(By.css('button'))[0];
        expect(prevButton.nativeElement.disabled).toBeTrue();
    });

    it('should emit sortChange and rotate directions', () => {
        spyOn(component.sortChange, 'emit');
        fixture.componentRef.setInput('config', { sortable: true });
        fixture.detectChanges();

        const firstHeader = fixture.debugElement.query(By.css('th.cursor-pointer'));

        // 1st click: asc
        firstHeader.nativeElement.click();
        expect(component.sortChange.emit).toHaveBeenCalledWith({ column: 'name', direction: 'asc' });

        // 2nd click: desc
        firstHeader.nativeElement.click();
        expect(component.sortChange.emit).toHaveBeenCalledWith({ column: 'name', direction: 'desc' });

        // 3rd click: none
        firstHeader.nativeElement.click();
        expect(component.sortChange.emit).toHaveBeenCalledWith({ column: 'name', direction: 'none' });
    });

    it('should sort data locally when pagination is disabled', () => {
        fixture.componentRef.setInput('dataSource', [
            { id: 2, name: 'B' },
            { id: 1, name: 'A' },
            { id: 3, name: 'C' }
        ]);
        fixture.componentRef.setInput('config', { sortable: true });
        fixture.detectChanges();

        const firstHeader = fixture.debugElement.query(By.css('th.cursor-pointer'));

        // Sort by Name ASC (A, B, C)
        firstHeader.nativeElement.click();
        fixture.detectChanges();

        const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
        expect(rows[0].nativeElement.textContent).toContain('A');
        expect(rows[2].nativeElement.textContent).toContain('C');

        // Sort by Name DESC (C, B, A)
        firstHeader.nativeElement.click();
        fixture.detectChanges();

        const rowsDesc = fixture.debugElement.queryAll(By.css('tbody tr'));
        expect(rowsDesc[0].nativeElement.textContent).toContain('C');
        expect(rowsDesc[2].nativeElement.textContent).toContain('A');
    });
});
