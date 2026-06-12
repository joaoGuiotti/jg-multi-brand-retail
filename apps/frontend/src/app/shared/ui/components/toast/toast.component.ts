import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Toast } from '../../services/toast/toast.service';

@Component({
  selector: 'ui-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
  ],
  template: `
    <div
      [@slideInOut]
      class="max-w-md w-full pointer-events-auto transition-all duration-300 mb-1"
      >
      <div
        class="backdrop-blur-md border rounded-xl shadow-2xl relative"
        [ngClass]="getTypeClasses()"
        >
        <div class="p-4 flex items-start gap-4">
          <!-- Icon -->
          <div class="flex-shrink-0 pt-0.5">
            @switch (toast.type) {
              @case ('success') {
                <svg class="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              @case ('error') {
                <svg class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              @default {
                <svg class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            }
          </div>
    
          <div class="flex-1">
            <p class="text-sm font-bold text-content">{{ toast.title }}</p>
            <p class="mt-1 text-sm text-content-secondary leading-relaxed">{{ toast.message }}</p>
          </div>
    
          <div class="flex-shrink-0">
            <button
              (click)="close.emit()"
              class="p-1 rounded-lg hover:bg-surface-hover transition-colors"
              >
              <svg class="h-5 w-5 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
    
        <!-- Progress Bar Container (Clipped to bottom radius) -->
        @if (toast.duration !== 0) {
          <div
            class="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl pointer-events-none"
            >
            <div
              class="h-full bg-black/10 transition-all duration-linear"
              [style.width.%]="progress"
            ></div>
          </div>
        }
      </div>
    </div>
    `,
  styles: [`
    .transition-all { transition-property: all; }
    .duration-linear { transition-timing-function: linear; }
  `]
})
export class ToastComponent implements OnInit {
  @Input({ required: true }) toast!: Toast;
  @Output() close = new EventEmitter<void>();

  progress = 100;

  ngOnInit() {
    if (this.toast.duration !== 0) {
      const duration = this.toast.duration || 5000;
      const interval = 50;
      const step = (interval / duration) * 100;
      
      const timer = setInterval(() => {
        this.progress -= step;
        if (this.progress <= 0) {
          clearInterval(timer);
        }
      }, interval);
    }
  }

  getTypeClasses() {
    switch (this.toast.type) {
      case 'success': return 'bg-success-bg/80 border-success/20';
      case 'error': return 'bg-error-bg/80 border-error/20';
      case 'warning': return 'bg-warning-bg/80 border-warning/20';
      default: return 'bg-surface/80 border-outline/50';
    }
  }
}
