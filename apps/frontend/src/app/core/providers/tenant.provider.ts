import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { TenantService } from '../services/tenant.service';

/**
 * Configures the Tenant initialization for the application.
 * This ensures the Tenant context is resolved before the app finishes booting.
 *
 * @returns EnvironmentProviders
 */
export function provideTenant(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const tenantService = inject(TenantService);
    return tenantService.initializeTenant();
  });
}
