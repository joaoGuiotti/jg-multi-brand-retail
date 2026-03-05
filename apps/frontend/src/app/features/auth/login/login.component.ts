
import { Component, isDevMode } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UiButtonComponent, UiCardComponent, UiInputFieldComponent } from '@shared/ui';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterModule, UiButtonComponent, UiCardComponent, UiInputFieldComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    loginForm: FormGroup;
    errorMessage = '';
    isLoading = false;
    isDevMode = isDevMode();
    copiedField: string | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';

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
