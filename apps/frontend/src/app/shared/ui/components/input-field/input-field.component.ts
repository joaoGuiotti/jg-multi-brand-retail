
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    EventEmitter,
    inject,
    input,
    Output,
    signal
} from '@angular/core';
import {
    ControlValueAccessor,
    FormsModule,
    NgControl,
    ValidationErrors,
    Validators
} from '@angular/forms';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator, maskitoParseNumber, maskitoStringifyNumber } from '@maskito/kit';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

@Component({
    selector: 'ui-input-field',
    imports: [FormsModule, MaskitoDirective],
    templateUrl: './input-field.component.html',
    styleUrl: './input-field.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiInputFieldComponent implements ControlValueAccessor {
    label = input<string>('');
    placeholder = input<string>('');
    type = input<InputType>('text');
    thousandSeparator = input<string | null>('.');
    decimalSeparator = input<string | null>(',');
    decimalPlaces = input<number | null>(2);
    prefix = input<string | null>(null);

    hint = input<string | null>(null);
    error = input<string | null>(null);
    id = input<string>(`ui-input-${Math.random().toString(36).slice(2, 9)}`);
    step = input<string>('');
    required = input<boolean | undefined>(undefined);
    disabled = input<boolean>(false);

    @Output() valueChange = new EventEmitter<string>();

    value = signal<string>('');

    isDisabled = computed(() => this.disabled() || this._internalDisabled());
    isRequired = computed(() => this.required() ?? this.ngControl?.control?.hasValidator(Validators.required));

    inputType = computed(() => {
        if (this.type() === 'number' && this.mask())
            return 'text';
        return this.type();
    });

    mask = computed(() => {
        if (this.type() === 'number') {
            return maskitoNumberOptionsGenerator(this.maskitoOptions());
        }
        return null;
    });

    errorMessage = computed(() => {
        const errors = this.error() ?? this.controlErrors();
        if (!errors) return null;
        if (typeof errors === 'string') return errors;
        return this.translateValidationErrors(errors);
    });

    private _internalDisabled = signal<boolean>(false);

    private maskitoOptions = computed(() => ({
        thousandSeparator: this.thousandSeparator() ?? '',
        decimalSeparator: this.decimalSeparator() ?? '',
        maximumFractionDigits: this.decimalPlaces() ?? 2,
        prefix: this.prefix() ?? '',
    }));

    private controlErrors = signal<ValidationErrors | null | undefined>(null);
    controlTouchedOrDirty = signal<boolean>(false);

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    private ngControl = inject(NgControl, { optional: true, self: true });

    inputClasses = computed(() => {
        const base =
            'w-full px-3 py-2 bg-surface border rounded-lg text-content ' +
            'placeholder:text-content-tertiary focus:outline-none focus:ring-2 ' +
            'focus:ring-primary focus:border-transparent transition-colors ' +
            'disabled:opacity-50 disabled:cursor-not-allowed';

        const border = this.controlTouchedOrDirty() && this.errorMessage() ? 'border-error' : 'border-outline';

        return `${base} ${border}`;
    });

    constructor() {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    handleInput(event: Event): void {
        const raw = (event.target as HTMLInputElement).value;
        this.value.set(raw);

        if (this.type() === 'number' && this.mask()) {
            const parsed = maskitoParseNumber(raw, this.maskitoOptions());
            const numericValue = isNaN(parsed) ? null : parsed;
            this.onChange(numericValue as any);
            this.valueChange.emit(numericValue as any);
        } else {
            this.onChange(raw);
            this.valueChange.emit(raw);
        }

        // Update error state after Angular has had a chance to validate
        setTimeout(() => this.controlErrors.set(this.ngControl?.control?.errors));
    }

    handleBlur(): void {
        this.onTouched();
        this.controlTouchedOrDirty.set(true);
        this.controlErrors.set(this.ngControl?.control?.errors);
    }

    writeValue(val: any): void {
        if (this.type() === 'number' && val != null && !isNaN(Number(val))) {
            const formatted = maskitoStringifyNumber(Number(val), this.maskitoOptions());
            this.value.set(formatted);
        } else {
            this.value.set(val ?? '');
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._internalDisabled.set(isDisabled);
    }

    private translateValidationErrors(errors: ValidationErrors): string {
        if (errors['required']) {
            return 'This field is required';
        }
        if (errors['minlength']) {
            return `This field must be at least ${errors['minlength'].requiredLength} characters`;
        }
        if (errors['maxlength']) {
            return `This field must be at most ${errors['maxlength'].requiredLength} characters`;
        }
        if (errors['min']) {
            return `This field must be at least ${errors['min'].min}`;
        }
        if (errors['max']) {
            return `This field must be at most ${errors['max'].max}`;
        }
        if (errors['pattern']) {
            return 'This field is invalid';
        }
        return 'This field is invalid';
    }
}
