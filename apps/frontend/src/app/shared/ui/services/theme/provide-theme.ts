import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ThemeService } from './theme.service';

function initializeThemeFactory(themeService: ThemeService) {
    return () => themeService.initializeTheme()
}

/**
 * Provides the ThemeService for the application.
 * This should be used in the app.config.ts or main.ts.
 *
 * @returns EnvironmentProviders
 */
export function provideTheme(): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: APP_INITIALIZER,
            useFactory: initializeThemeFactory,
            deps: [ThemeService],
            multi: true
        }
    ]);
}
