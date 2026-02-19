import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    forwardRef,
    Input,
    Output,
} from '@angular/core';
import {
    ControlValueAccessor,
    FormsModule,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

@Component({
    selector: 'ui-input-field',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './input-field.component.html',
    styleUrl: './input-field.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UiInputFieldComponent),
            multi: true,
        },
    ],
})
export class UiInputFieldComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() type: InputType = 'text';
    @Input() hint: string | null = null;
    @Input() error: string | null = null;
    @Input() id = `ui-input-${Math.random().toString(36).slice(2, 9)}`;
    @Input() required = false;
    @Input() disabled = false;

    @Output() valueChange = new EventEmitter<string>();

    value = '';

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    get inputClasses(): string {
        const base =
            'w-full px-3 py-2 bg-surface border rounded-lg text-content ' +
            'placeholder:text-content-tertiary focus:outline-none focus:ring-2 ' +
            'focus:ring-primary focus:border-transparent transition-colors ' +
            'disabled:opacity-50 disabled:cursor-not-allowed';

        const border = this.error ? 'border-error' : 'border-outline';

        return `${base} ${border}`;
    }

    handleInput(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        this.value = val;
        this.onChange(val);
        this.valueChange.emit(val);
    }

    handleBlur(): void {
        this.onTouched();
    }

    // ControlValueAccessor
    writeValue(val: string): void {
        this.value = val ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
