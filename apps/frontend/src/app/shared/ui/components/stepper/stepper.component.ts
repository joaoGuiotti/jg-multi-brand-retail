import {
  Component,
  Input,
  ContentChildren,
  QueryList,
  AfterContentInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isActive()) {
      <div class="animate-fade-in content-wrapper">
        <ng-content></ng-content>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStepComponent {
  @Input({ required: true }) label = '';
  
  index = signal(0);
  isActive = signal(false);
}

@Component({
  selector: 'ui-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="block overflow-hidden">
      <!-- Stepper Header (Timeline) -->
      <!-- Stepper Header (Timeline) -->
      <!-- Stepper Header (Timeline) -->
      <div class="flex items-center justify-between relative px-2 mb-10 min-h-[40px]">
        <!-- Progress Background line (Gray) -->
        <div class="absolute top-5 left-0 w-full h-0.5 bg-outline -translate-y-1/2 z-10"></div>
        
        <!-- Active Progress line (Primary) -->
        <div class="absolute top-5 left-0 h-0.5 bg-primary -translate-y-1/2 z-20 transition-all duration-500"
          [style.width.%]="progressWidth()"></div>

        <!-- Render Step Indicators -->
        @for (step of stepsList(); track $index) {
          <div class="flex flex-col items-center gap-2 group relative z-30">
            <div class="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300"
              [ngClass]="{
                'bg-primary border-primary text-white shadow-lg': currentStep >= step.index(),
                'bg-surface border-outline text-content-tertiary': currentStep < step.index()
              }">
              <span *ngIf="currentStep <= step.index()">{{ step.index() }}</span>
              <svg *ngIf="currentStep > step.index()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-xs font-medium"
              [ngClass]="{'text-primary': currentStep >= step.index(), 'text-content-tertiary': currentStep < step.index()}">
              {{ step.label }}
            </span>
          </div>
        }
      </div>

      <!-- Stepper Content Body -->
      <div class="stepper-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStepperComponent implements AfterContentInit, OnChanges {
  @Input() currentStep = 1;
  @ContentChildren(UiStepComponent) stepsQuery!: QueryList<UiStepComponent>;

  stepsList = signal<UiStepComponent[]>([]);

  progressWidth = computed(() => {
    const list = this.stepsList();
    if (list.length <= 1) return 0;
    const progress = Math.max(0, Math.min(this.currentStep - 1, list.length - 1));
    return (progress / (list.length - 1)) * 100;
  });

  ngAfterContentInit() {
    this.updateSteps();
    this.stepsQuery.changes.subscribe(() => this.updateSteps());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentStep']) {
      this.updateSteps();
    }
  }

  private updateSteps() {
    if (!this.stepsQuery) return;
    
    // Convert to array and trigger UI update
    const list = this.stepsQuery.toArray();
    this.stepsList.set(list);

    // Update individual step states
    list.forEach((step, idx) => {
      const stepIdx = idx + 1;
      step.index.set(stepIdx);
      step.isActive.set(stepIdx === this.currentStep);
    });
  }
}
