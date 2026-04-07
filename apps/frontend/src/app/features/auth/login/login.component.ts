
import { Component, OnInit, isDevMode } from '@angular/core';
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
    errorMessage = '';
    successMessage = '';
    isLoading = false;
    isDevMode = isDevMode();
    copiedField: string | null = null;

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
            this.successMessage = 'Senha atualizada com sucesso. Faça login com a nova senha.';
        }
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            this.authService.login(this.loginForm.value).subscribe({
                next: () => {
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
                }
            }).add(() => {
                this.isLoading = false;
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
            this.copiedField = field;
            setTimeout(() => (this.copiedField = null), 1500);
        });
    }

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }
}
