import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'ui-loading',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div [class.loading-overlay]="overlay()" class="flex flex-col items-center justify-center gap-3">
      <div class="spinner-container">
        <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      @if (message()) {
        <span class="text-sm font-semibold text-primary animate-pulse">{{ message() }}</span>
      }
    </div>
  `,
    styles: [`
    .loading-overlay {
      position: absolute;
      inset: 0;
      z-index: 50;
      background-color: transparent; /* Remove whitish tint completely */
      backdrop-filter: blur(3px); /* Slightly stronger blur to help focus with zero opacity bg */
    }

    .spinner-container {
      position: relative;
    }
  `]
})
export class UiLoadingComponent {
    message = input<string>('');
    overlay = input<boolean>(false);
}
