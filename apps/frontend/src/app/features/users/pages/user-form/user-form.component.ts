import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { 
  UiButtonComponent, 
  UiCardComponent, 
  UiInputFieldComponent,
  UiPageHeaderComponent
} from '@shared/ui';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    UiInputFieldComponent,
    UiButtonComponent,
    UiCardComponent,
    UiPageHeaderComponent
],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['USER', [Validators.required]]
  });

  get name() { return this.userForm.get('name'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = this.userForm.value;
    
    this.authService.createUser(formData as any).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Erro ao criar funcionário. Tente novamente.');
        this.isLoading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
