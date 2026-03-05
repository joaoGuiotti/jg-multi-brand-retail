import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
    selector: 'ui-card',
    standalone: true,
    imports: [],
    templateUrl: './card.component.html',
    styleUrl: './card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiCardComponent {
    padding = input<CardPadding>('md');
    shadow = input(true);
    hoverable = input(false);
    bordered = input(true);
    rounded = input(true);
    title = input<string | null>(null);
    subTitle = input<string | null>(null);

    classes = computed(() => {
        const base = 'bg-surface overflow-hidden';

        const shadow = this.shadow() ? 'shadow-md' : '';
        const border = this.bordered() ? 'border border-outline' : '';
        const hover = this.hoverable()
            ? 'hover:shadow-lg hover:border-primary transition-all cursor-pointer'
            : '';
        const rounded = this.rounded() ? 'rounded-lg' : '';

        return [base, shadow, border, hover, rounded]
            .filter(Boolean)
            .join(' ');
    });

    contentClasses = computed(() => {
        const paddings: Record<CardPadding, string> = {
            none: '',
            sm: 'p-3',
            md: 'p-6',
            lg: 'p-8',
        };
        return paddings[this.padding()];
    });
}
