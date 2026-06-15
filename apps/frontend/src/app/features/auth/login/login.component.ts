import {
  Component,
  OnInit,
  isDevMode,
  signal,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UiButtonComponent, UiCardComponent, UiInputFieldComponent } from '@shared/ui';
import { AuthService } from '../../../core/services/auth.service';
import { AUTH_QUERY_PARAMS } from '../auth.constants';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputFieldComponent,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  isDevMode = isDevMode();
  copiedField = signal<string | null>(null);

  tenantService = inject(TenantService);

  // Computed signals from TenantService
  tenantName = computed(() => this.tenantService.tenant()?.name || 'Retail POS');
  tenantLogoUrl = computed(() => this.tenantService.tenant()?.logoUrl || null);
  tenantActive = this.tenantService.isActive;
  isCustomTenant = computed(() => !!this.tenantService.tenant());

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    const passwordReset = this.route.snapshot.queryParamMap.get(
      AUTH_QUERY_PARAMS.PASSWORD_RESET_SUCCESS
    );
    if (passwordReset === 'true') {
      this.successMessage.set('Senha atualizada com sucesso. Faça login com a nova senha.');
    }

    if (!this.tenantActive()) {
      this.errorMessage.set(
        'Esta loja está temporariamente indisponível. Entre em contato com o suporte.'
      );
      this.loginForm.disable();
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid && this.tenantActive()) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      this.authService
        .login(this.loginForm.value)
        .subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (error) => {
            this.errorMessage.set(
              error.error?.message || 'Login failed. Please check your credentials.'
            );
          },
        })
        .add(() => {
          this.isLoading.set(false);
        });
    }
  }

  autoLogin(): void {
    if (isDevMode()) {
      this.loginForm.patchValue({
        email: 'admin@lojademo.com',
        password: 'loja123',
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
