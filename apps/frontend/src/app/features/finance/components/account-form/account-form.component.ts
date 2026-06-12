import { Component, EventEmitter, inject, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { UiButtonComponent, ModalRef, MODAL_REF } from '@shared/ui';
import { FinanceService, CreateAccountDto, FinancialAccountType } from '../../services/finance.service';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [FormsModule, UiButtonComponent],
  templateUrl: './account-form.component.html'
})
export class AccountFormComponent {
  private financeService = inject(FinanceService);
  public modalRef = inject(MODAL_REF) as ModalRef<any>;

  dto: CreateAccountDto = {
    type: FinancialAccountType.PAYABLE,
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    category: 'GENERAL'
  };

  isSubmitting = false;

  onSubmit() {
    this.isSubmitting = true;
    this.financeService.createAccount(this.dto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.modalRef.close(res);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.message || 'Error creating account');
      }
    });
  }

  cancel() {
    this.modalRef.close();
  }
}
