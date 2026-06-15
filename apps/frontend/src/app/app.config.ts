import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTheme } from '@shared/ui';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { provideTenant } from './core/providers/tenant.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor, tenantInterceptor])),
    provideTenant(), // Resolve o contexto do Tenant antes da aplicação iniciar
    provideTheme(), // Inicia o tema e carrega as configurações do localStorage
  ],
};
