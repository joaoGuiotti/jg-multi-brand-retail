
import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { UiButtonComponent } from '../button/button.component';

@Component({
    selector: 'ui-theme-toggle',
    imports: [UiButtonComponent],
    templateUrl: './theme-toggle.component.html',
    styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
    private themeService = inject(ThemeService);
    theme = this.themeService.theme;

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }
}
