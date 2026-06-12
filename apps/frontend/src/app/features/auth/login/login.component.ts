import { Component, OnInit, isDevMode, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UiButtonComponent, UiCardComponent, UiInputFieldComponent } from '@shared/ui';
import { AuthService } from '../../../core/services/auth.service';
import { AUTH_QUERY_PARAMS } from '../auth.constants';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterModule, UiButtonComponent, UiCardComponent, UiInputFieldComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    errorMessage = signal('');
    successMessage = signal('');
    isLoading = signal(false);
    isDevMode = isDevMode();
    copiedField = signal<string | null>(null);

    // Tenant Branding States
    tenantName = signal('Retail POS');
    tenantLogoUrl = signal<string | null>(null);
    tenantActive = signal(true);
    isCustomTenant = signal(false);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    ngOnInit(): void {
        const passwordReset = this.route.snapshot.queryParamMap.get(AUTH_QUERY_PARAMS.PASSWORD_RESET_SUCCESS);
        if (passwordReset === 'true') {
            this.successMessage.set('Senha atualizada com sucesso. Faça login com a nova senha.');
        }

        this.resolveTenantBranding();
    }

    private resolveTenantBranding(): void {
        // 1. Detect from Query Parameters (convenient for local dev without hosts configuration)
        let slug = this.route.snapshot.queryParamMap.get('tenant');

        // 2. If not in query params, detect from Host Subdomain
        if (!slug) {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            if (parts.length > 1) {
                const subdomain = parts[0].toLowerCase();
                const ignored = ['www', 'app', 'api', 'admin'];
                if (!ignored.includes(subdomain)) {
                    slug = subdomain;
                }
            }
        }

        // 3. Fetch Tenant details if slug was found
        if (slug) {
            this.authService.getPublicTenant(slug).subscribe({
                next: (res) => {
                    if (res && res.data) {
                        const tenant = res.data;
                        this.tenantName.set(tenant.name);
                        this.tenantLogoUrl.set(tenant.logoUrl);
                        this.tenantActive.set(tenant.active);
                        this.isCustomTenant.set(true);

                        // Apply Dynamic Brand Colors
                        if (tenant.theme) {
                            this.applyTenantTheme(tenant.theme.primaryColor, tenant.theme.accentColor);
                        }

                        // Block Login if tenant is inactive
                        if (!tenant.active) {
                            this.errorMessage.set('Esta loja está temporariamente indisponível. Entre em contato com o suporte.');
                            this.loginForm.disable();
                        }
                    }
                },
                error: (err) => {
                    console.warn('Failed to resolve tenant visual settings, falling back to default theme:', err);
                    this.resetTenantTheme();
                }
            });
        } else {
            this.resetTenantTheme();
        }
    }

    private applyTenantTheme(primary: string, accent: string): void {
        document.documentElement.style.setProperty('--tenant-primary-color', primary);
        document.documentElement.style.setProperty('--tenant-accent-color', accent);
    }

    private resetTenantTheme(): void {
        this.tenantName.set('Retail POS');
        this.tenantLogoUrl.set(null);
        this.tenantActive.set(true);
        this.isCustomTenant.set(false);
        document.documentElement.style.setProperty('--tenant-primary-color', '#3b82f6');
        document.documentElement.style.setProperty('--tenant-accent-color', '#1d4ed8');
    }

    onSubmit(): void {
        if (this.loginForm.valid && this.tenantActive()) {
            this.isLoading.set(true);
            this.errorMessage.set('');
            this.successMessage.set('');

            this.authService.login(this.loginForm.value).subscribe({
                next: () => {
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    this.errorMessage.set(error.error?.message || 'Login failed. Please check your credentials.');
                }
            }).add(() => {
                this.isLoading.set(false);
            });
        }
    }

    autoLogin(): void {
        if (isDevMode()) {
            this.loginForm.patchValue({
                email: 'admin@lojademo.com',
                password: 'loja123'
            });
            this.onSubmit();
        }
    }

    copyToClipboard(field: string, value: string): void {
        navigator.clipboard.writeText(value).then(() => {
            this.copiedField.set(field);
            setTimeout(() => this.copiedField.set(null), 1500);
        });
    }

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }
}
