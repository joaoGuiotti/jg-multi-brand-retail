import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Output,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'ui-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './button.component.html',
    styleUrl: './button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
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

        const variants: Record<ButtonVariant, string> = {
            primary:
                'bg-primary hover:bg-primary-hover text-white focus:ring-primary',
            secondary:
                'bg-surface-tertiary hover:bg-surface-hover text-content border border-outline focus:ring-primary',
            ghost:
                'bg-transparent hover:bg-surface-tertiary text-content focus:ring-primary',
            danger:
                'bg-danger hover:bg-red-700 text-white focus:ring-error',
        };

        const width = this.fullWidth ? 'w-full' : '';

        return [base, sizes[this.size], variants[this.variant], width]
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
}
