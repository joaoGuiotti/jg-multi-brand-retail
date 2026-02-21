
import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
export type BadgeSize = 'sm' | 'md';

@Component({
    selector: 'ui-badge',
    imports: [],
    template: `
    <span [class]="classes">
      @if (dot) {
        <span [class]="dotClasses" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </span>
    `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiBadgeComponent {
    @Input() variant: BadgeVariant = 'default';
    @Input() size: BadgeSize = 'md';
    @Input() dot = false;
    @Input() pill = true;

    get classes(): string {
        const base = 'inline-flex items-center gap-1.5 font-medium';

        const sizes: Record<BadgeSize, string> = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-1 text-xs',
        };

        const radius = this.pill ? 'rounded-full' : 'rounded';

        const variants: Record<BadgeVariant, string> = {
            default: 'bg-surface-tertiary text-content-secondary',
            success: 'bg-success-bg text-success',
            warning: 'bg-warning-bg text-warning',
            error: 'bg-error-bg text-error',
            info: 'bg-info-bg text-info',
        };

        return [base, sizes[this.size], radius, variants[this.variant]]
            .filter(Boolean)
            .join(' ');
    }

    get dotClasses(): string {
        const variants: Record<BadgeVariant, string> = {
            default: 'bg-content-tertiary',
            success: 'bg-success',
            warning: 'bg-warning',
            error: 'bg-error',
            info: 'bg-info',
        };
        return `w-1.5 h-1.5 rounded-full ${variants[this.variant]}`;
    }
}
