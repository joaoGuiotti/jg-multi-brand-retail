import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { ThemeService } from './theme.service';

export * from './theme.service';

/**
 * Provides the ThemeService initialization for the application.
 */
export function provideTheme(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const themeService = inject(ThemeService);
    return themeService.initializeTheme();
  });
}
