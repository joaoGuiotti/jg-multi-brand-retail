import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PublicTenant } from '../models/auth.model';
import { AuthService } from './auth.service';
import { catchError, map, of, tap } from 'rxjs';
import { ThemeService } from '@shared/ui';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      const tenantTheme = this.tenantTheme();
      if (tenantTheme) {
        this.themeService.applyTenantThemeVariables(
          tenantTheme.primaryColor,
          tenantTheme.accentColor
        );
      } else {
        this.themeService.resetTenantThemeVariables();
      }
    });
  }

  // Global Signal for Tenant State
  private readonly currentTenantSignal = signal<PublicTenant | null>(null);

  // Public exposed Signals
  public readonly tenant = this.currentTenantSignal.asReadonly();
  public readonly tenantTheme = computed(() => this.tenant()?.theme);
  public readonly isActive = computed(() => this.tenant()?.active ?? true);

  /**
   * Initializes the tenant context based on URL or Query parameters.
   * Intended to be called during provideAppInitializer.
   */
  public initializeTenant() {
    const slug = this.detectTenantSlug();

    if (!slug) {
      // No tenant slug found, proceed with default behavior (or main app context)
      return of(null);
    }

    return this.authService.getPublicTenant(slug).pipe(
      map((res) => res.data),
      tap((tenant) => {
        if (tenant) {
          this.currentTenantSignal.set(tenant);
        }
      }),
      catchError((err) => {
        console.warn('Failed to load tenant context:', err);
        return of(null); // Continue app booting even if tenant load fails
      })
    );
  }

  /**
   * Explicitly sets the tenant (useful after login or tenant switching).
   */
  public setTenant(tenant: PublicTenant | null): void {
    this.currentTenantSignal.set(tenant);
  }

  /**
   * Returns the current Tenant ID, safely returning undefined if no tenant is set.
   */
  public currentTenantId(): string | undefined {
    return this.tenant()?.id;
  }

  private detectTenantSlug(): string | null {
    // 1. Detect from Query Parameters (convenient for local dev without hosts configuration)
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get('tenant');
    if (querySlug) {
      return querySlug;
    }

    // 2. Detect from Host Subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 1) {
      const subdomain = parts[0].toLowerCase();
      const ignored = ['www', 'app', 'api', 'admin', 'localhost'];
      if (!ignored.includes(subdomain)) {
        return subdomain;
      }
    }

    return null;
  }
}
