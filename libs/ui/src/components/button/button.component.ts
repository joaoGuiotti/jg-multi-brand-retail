
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Output,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'ui-button',
    imports: [],
    templateUrl: './button.component.html',
    styleUrl: './button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiButtonComponent {
    @Input() outline = false;
    @Input() variant: ButtonVariant = 'primary';
    @Input() size: ButtonSize = 'md';
    @Input() loading = false;
    @Input() disabled = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() fullWidth = false;
    @Input() class = '';

    @Output() clicked = new EventEmitter<MouseEvent>();

    @HostBinding('class') get hostClass(): string {
        return this.fullWidth ? 'block w-full' : 'inline-block';
    }

    get classes(): string {
        const base = `${this.class} ` +
            'inline-flex items-center justify-center gap-2 font-medium rounded-lg ' +
            'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
            'disabled:opacity-50 disabled:cursor-not-allowed select-none';

        const sizes: Record<ButtonSize, string> = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
        };

        const variants = this.getStyleVariant(this.variant, this.outline);

        const width = this.fullWidth ? 'w-full' : '';

        return [base, sizes[this.size], variants, width]
            .filter(Boolean)
            .join(' ');
    }

    get isDisabled(): boolean {
        return this.disabled || this.loading;
    }

    handleClick(event: MouseEvent): void {
        if (!this.isDisabled) {
            this.clicked.emit(event);
        }
    }

    private getStyleVariant(variant: ButtonVariant, outline: boolean): string {
        const variants: Record<ButtonVariant, string> = {
            primary:
                outline ?
                    'bg-transparent hover:bg-primary/5 text-primary border border-primary focus:ring-primary'
                    : 'bg-primary hover:bg-primary-hover text-white focus:ring-primary',
            secondary:
                outline ? 'bg-transparent hover:bg-surface-tertiary text-content-secondary border border-secondary focus:ring-primary'
                    : 'bg-surface-tertiary hover:bg-surface-hover text-content border border-outline focus:ring-primary',
            ghost:
                outline ? 'bg-transparent hover:bg-surface-tertiary text-content-tertiary border border-outline/50 focus:ring-primary'
                    : 'bg-transparent hover:bg-surface-tertiary text-content focus:ring-primary',
            danger:
                outline ? 'bg-transparent hover:bg-danger/5 text-danger border border-danger focus:ring-error'
                    : 'bg-danger hover:bg-red-700 text-white focus:ring-error',
            success:
                outline ? 'bg-transparent hover:bg-success/5 text-success border border-success focus:ring-success'
                    : 'bg-success hover:bg-success-hover text-white focus:ring-success',
            warning:
                outline ? 'bg-transparent hover:bg-amber-500/10 text-amber-600 border border-amber-500 focus:ring-amber-500'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold shadow-sm hover:shadow-amber-500/30 hover:shadow-md focus:ring-amber-500',
        };

        return variants[variant];
    }
}
