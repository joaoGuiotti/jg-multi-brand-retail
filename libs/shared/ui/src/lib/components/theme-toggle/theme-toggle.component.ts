import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme/theme.service';
import { UiButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-theme-toggle',
    standalone: true,
    imports: [CommonModule, UiButtonComponent],
    templateUrl: './theme-toggle.component.html',
    styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
    themeService = inject(ThemeService);
    theme = this.themeService.theme;

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }
}
