
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaskitoOptions } from '@maskito/core';
import { UI_DOCUMENT_MASK, UiButtonComponent, UiCardComponent, UiInputFieldComponent, UiPageHeaderComponent } from '@shared/ui';
import { CustomersService } from '../../../../core/services/customers.service';
import { LoyaltyHistoryComponent } from '../../../loyalty/components/loyalty-history/loyalty-history.component';

@Component({
    selector: 'app-customer-form',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputFieldComponent,
    LoyaltyHistoryComponent,
    UiPageHeaderComponent
],
    templateUrl: './customer-form.component.html',
    styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit {
    customerForm: FormGroup;
    isEditMode = false;
    customerId: string | null = null;
    isLoading = false;
    errorMessage = '';
    isSubmitting = false;
    readonly docMask: MaskitoOptions = UI_DOCUMENT_MASK;

    constructor(
        private fb: FormBuilder,
        private customersService: CustomersService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.customerForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            document: ['', [Validators.required]],
            isActive: [true],
            address: this.fb.group({
                street: ['', [Validators.required]],
                number: ['', [Validators.required]],
                complement: [''],
                city: ['', [Validators.required]],
                state: ['', [Validators.required]],
                zipCode: ['', [Validators.required]]
            })
        });
    }

    ngOnInit(): void {
        this.customerId = this.route.snapshot.paramMap.get('id');
        if (this.customerId) {
            this.isEditMode = true;
            this.loadCustomer(this.customerId);
        }
    }

    loadCustomer(id: string): void {
        this.isLoading = true;
        this.customersService.getCustomer(id).subscribe({
            next: ({ data }) => {
                this.customerForm.patchValue({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    document: data.document,
                    isActive: data.isActive,
                    address: {
                        street: data.address.street,
                        number: data.address.number,
                        complement: data.address.complement,
                        city: data.address.city,
                        state: data.address.state,
                        zipCode: data.address.zipCode
                    }
                });
                this.isLoading = false;
            },
            error: (error) => {
                this.errorMessage = error.error?.message || 'Failed to load customer';
                this.isLoading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.customerForm.valid) {
            this.isSubmitting = true;
            this.errorMessage = '';

            const formValue = this.customerForm.value;

            if (this.isEditMode && this.customerId) {
                this.customersService.updateCustomer(this.customerId, formValue).subscribe({
                    next: () => {
                        this.router.navigate(['/customers']);
                    },
                    error: (error) => {
                        this.errorMessage = error.error?.message || 'Failed to update customer';
                        this.isSubmitting = false;
                    }
                });
            } else {
                this.customersService.createCustomer(formValue).subscribe({
                    next: () => {
                        this.router.navigate(['/customers']);
                    },
                    error: (error) => {
                        this.errorMessage = error.error?.message || 'Failed to create customer';
                        this.isSubmitting = false;
                    }
                });
            }
        } else {
            this.customerForm.markAllAsTouched();
        }
    }

    cancel(): void {
        this.router.navigate(['/customers']);
    }

    get firstName() { return this.customerForm.get('firstName'); }
    get lastName() { return this.customerForm.get('lastName'); }
    get email() { return this.customerForm.get('email'); }
    get phone() { return this.customerForm.get('phone'); }
    get document() { return this.customerForm.get('document'); }
}
