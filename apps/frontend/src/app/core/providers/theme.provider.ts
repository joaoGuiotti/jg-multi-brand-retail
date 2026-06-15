import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { ThemeService } from '@shared/ui/services/theme';

/**
 * Provides the ThemeService for the application.
 * This should be used in the app.config.ts or main.ts.
 *
 * @returns EnvironmentProviders
 */
export function provideTheme(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const themeService = inject(ThemeService);
    return themeService.initializeTheme();
  });
}
