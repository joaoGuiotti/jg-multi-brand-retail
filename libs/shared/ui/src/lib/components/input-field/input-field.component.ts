import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    EventEmitter,
    input,
    Optional,
    Output,
    Self,
    signal
} from '@angular/core';
import {
    ControlValueAccessor,
    FormsModule,
    NgControl,
    Validators
} from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

@Component({
    selector: 'ui-input-field',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './input-field.component.html',
    styleUrl: './input-field.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiInputFieldComponent implements ControlValueAccessor {
    label = input<string>('');
    placeholder = input<string>('');
    type = input<InputType>('text');
    hint = input<string | null>(null);
    error = input<string | null>(null);
    id = input<string>(`ui-input-${Math.random().toString(36).slice(2, 9)}`);
    required = input<boolean | undefined>(undefined);
    disabled = input<boolean>(false);

    @Output() valueChange = new EventEmitter<string>();

    value = signal<string>('');
    private _internalDisabled = signal<boolean>(false);

    isDisabled = computed(() => this.disabled() || this._internalDisabled());
    isRequired = computed(() => this.required() ?? this.ngControl?.control?.hasValidator(Validators.required));

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    inputClasses = computed(() => {
        const base =
            'w-full px-3 py-2 bg-surface border rounded-lg text-content ' +
            'placeholder:text-content-tertiary focus:outline-none focus:ring-2 ' +
            'focus:ring-primary focus:border-transparent transition-colors ' +
            'disabled:opacity-50 disabled:cursor-not-allowed';

        const border = this.error() ? 'border-error' : 'border-outline';

        return `${base} ${border}`;
    });

    // pegar ngControl e validar se tem required
    constructor(@Optional() @Self() public ngControl: NgControl) {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    handleInput(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        this.value.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }

    handleBlur(): void {
        this.onTouched();
    }

    // ControlValueAccessor
    writeValue(val: string): void {
        this.value.set(val ?? '');
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
}
