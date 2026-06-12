
import { Component, computed, EventEmitter, input, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'ui-pagination',
    standalone: true,
    imports: [],
    template: `
    <div class="bg-surface-secondary px-6 py-3 flex items-center justify-between border-t border-outline">
      <div class="text-sm text-content-secondary">
        Showing 
        <span class="font-medium">{{ (currentPage() - 1) * pageSize() + 1 }}</span> 
        to 
        <span class="font-medium">{{ Math.min(currentPage() * pageSize(), totalItems()) }}</span>
        of 
        <span class="font-medium">{{ totalItems() }}</span> 
        results
      </div>
      
      <div class="flex gap-2">
        <!-- First Page -->
        <button 
          (click)="goToFirst()" 
          [disabled]="currentPage() === 1"
          title="First Page"
          class="p-1 px-2 text-sm font-medium rounded-md border border-outline bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[32px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
        </button>

        <!-- Previous Page -->
        <button 
          (click)="previousPage()" 
          [disabled]="currentPage() === 1"
          title="Previous Page"
          class="p-1 px-2 text-sm font-medium rounded-md border border-outline bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[32px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        @for (page of pageNumbers(); track page) {
          <button 
            (click)="goToPage(page)" 
            [class.bg-primary]="page === currentPage()"
            [class.text-white]="page === currentPage()"
            [class.bg-surface]="page !== currentPage()"
            class="px-3 py-1 text-sm font-medium rounded-md border border-outline hover:bg-surface-hover transition-colors min-w-[32px] flex items-center justify-center"
          >
            {{ page }}
          </button>
        }

        <!-- Next Page -->
        <button 
          (click)="nextPage()" 
          [disabled]="currentPage() === totalPages()"
          title="Next Page"
          class="p-1 px-2 text-sm font-medium rounded-md border border-outline bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[32px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>

        <!-- Last Page -->
        <button 
          (click)="goToLast()" 
          [disabled]="currentPage() === totalPages()"
          title="Last Page"
          class="p-1 px-2 text-sm font-medium rounded-md border border-outline bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[32px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/></svg>
        </button>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class UiPaginationComponent {
    currentPage = input(1);
    pageSize = input(10);
    totalItems = input(0);
    maxVisiblePages = input(5);

    @Output() pageChange = new EventEmitter<number>();

    protected readonly Math = Math;

    totalPages = computed(() => {
        if (this.totalItems() === 0 || this.pageSize() === 0) return 1;
        return Math.ceil(this.totalItems() / this.pageSize());
    });

    pageNumbers = computed(() => {
        const pages: number[] = [];
        const total = this.totalPages();
        const current = this.currentPage();
        const maxVisible = this.maxVisiblePages();

        if (total <= 1) return [1];

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

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
            this.pageChange.emit(page);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.goToPage(this.currentPage() + 1);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.goToPage(this.currentPage() - 1);
        }
    }

    goToFirst(): void {
        if (this.currentPage() !== 1) {
            this.goToPage(1);
        }
    }

    goToLast(): void {
        if (this.currentPage() !== this.totalPages()) {
            this.goToPage(this.totalPages());
        }
    }
}
