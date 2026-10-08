
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { UiButtonComponent } from '../button/button.component';
import { UiTooltipDirective } from '@shared/ui/directives';

@Component({
    selector: 'ui-theme-toggle',
    imports: [UiButtonComponent, UiTooltipDirective],
    templateUrl: './theme-toggle.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
    private themeService = inject(ThemeService);
    theme = this.themeService.theme;

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }
}
