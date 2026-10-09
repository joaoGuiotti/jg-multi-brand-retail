import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UiButtonComponent, UiCardComponent, UiInputFieldComponent } from '@shared/ui';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputFieldComponent,
  ],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  form: FormGroup;
  isLoading = signal(false);
  submitted = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    // T041: Pre-fill email from query param (e.g., when redirected from reset-password error state)
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.form.patchValue({ email: emailParam });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;
    this.isLoading.set(true);

    this.authService
      .forgotPassword(this.form.value.email)
      .subscribe({
        next: () => {
          this.submitted.set(true);
        },
        error: () => {
          // T037 spec: always show generic success message even on errors (anti-enumeration)
          this.submitted.set(true);
        },
      })
      .add(() => {
        this.isLoading.set(false);
      });
  }

  get email() {
    return this.form.get('email');
  }
}
