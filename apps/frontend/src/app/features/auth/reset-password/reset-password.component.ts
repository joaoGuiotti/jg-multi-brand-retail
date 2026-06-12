import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UiButtonComponent, UiCardComponent, UiInputFieldComponent } from '@shared/ui';
import { AuthService } from '../../../core/services/auth.service';
import { AUTH_QUERY_PARAMS } from '../auth.constants';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    if (!newPassword || !confirmPassword) return null;
    return newPassword.value !== confirmPassword.value ? { passwordMismatch: true } : null;
};

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterModule, UiButtonComponent, UiCardComponent, UiInputFieldComponent],
    templateUrl: './reset-password.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
    form: FormGroup;
    isLoading = false;
    errorMessage = '';
    success = false;
    invalidLink = false;

    token = '';
    email = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.form = this.fb.group(
            {
                newPassword: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', [Validators.required]],
            },
            { validators: passwordMatchValidator },
        );
    }

    ngOnInit(): void {
        this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
        this.email = this.route.snapshot.queryParamMap.get('email') ?? '';

        if (!this.token || !this.email) {
            this.invalidLink = true;
        }
    }

    onSubmit(): void {
        if (this.form.invalid || this.isLoading || this.invalidLink) return;
        this.isLoading = true;
        this.errorMessage = '';

        const { newPassword } = this.form.value;

        this.authService.resetPassword(this.token, this.email, newPassword).subscribe({
            next: () => {
                this.success = true;
                // Navigate to login with success indicator after short delay
                setTimeout(() => {
                    this.router.navigate(['/login'], {
                        queryParams: { [AUTH_QUERY_PARAMS.PASSWORD_RESET_SUCCESS]: 'true' },
                    });
                }, 2000);
            },
            error: (err) => {
                this.errorMessage = err.error?.message ?? 'Este link é inválido ou expirou.';
            },
        }).add(() => {
            this.isLoading = false;
        });
    }

    get newPassword() { return this.form.get('newPassword'); }
    get confirmPassword() { return this.form.get('confirmPassword'); }
    get hasPasswordMismatch() {
        return this.form.errors?.['passwordMismatch'] && this.confirmPassword?.touched;
    }

    get requestNewLinkUrl() {
        return `/forgot-password?email=${encodeURIComponent(this.email)}`;
    }
}
