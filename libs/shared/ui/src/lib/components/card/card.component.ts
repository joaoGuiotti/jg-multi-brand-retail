import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
    selector: 'ui-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card.component.html',
    styleUrl: './card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {
    @Input() padding: CardPadding = 'md';
    @Input() shadow = true;
    @Input() hoverable = false;
    @Input() bordered = true;
    @Input() rounded = true;

    get classes(): string {
        const base = 'bg-surface';

        const paddings: Record<CardPadding, string> = {
            none: '',
            sm: 'p-3',
            md: 'p-6',
            lg: 'p-8',
        };

        const shadow = this.shadow ? 'shadow-md' : '';
        const border = this.bordered ? 'border border-outline' : '';
        const hover = this.hoverable
            ? 'hover:shadow-lg hover:border-primary transition-all cursor-pointer'
            : '';
        const rounded = this.rounded ? 'rounded-lg' : '';

        return [base, paddings[this.padding], shadow, border, hover, rounded]
            .filter(Boolean)
            .join(' ');
    }
}
