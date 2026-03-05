import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ContentChild,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostListener,
    input,
    Output,
    signal,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {
    ControlValueAccessor,
    FormsModule,
    NG_VALUE_ACCESSOR
} from '@angular/forms';
import { UiOverlayComponent } from '../overlay/overlay.component';

@Component({
    selector: 'ui-autocomplete',
    standalone: true,
    imports: [CommonModule, FormsModule, NgTemplateOutlet, UiOverlayComponent],
    templateUrl: './autocomplete.component.html',
    styleUrl: './autocomplete.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UiAutocompleteComponent),
            multi: true
        }
    ]
})
export class UiAutocompleteComponent implements ControlValueAccessor {
    @ContentChild('itemTemplate') itemTemplate?: TemplateRef<any>;
    @ContentChild('groupTemplate') groupTemplate?: TemplateRef<any>;

    label = input<string>('');
    placeholder = input<string>('');
    suggestions = input<any[]>([]);
    dataKey = input<string | null>(null);
    field = input<string | null>(null);
    multiple = input<boolean>(false);
    group = input<boolean>(false);
    groupLabel = input<string | null>(null);
    groupChildren = input<string | null>(null);
    id = input<string>(`ui-autocomplete-${Math.random().toString(36).slice(2, 9)}`);
    disabled = input<boolean>(false);
    dismissable = input<boolean>(true);
    dropdown = input<boolean>(false);
    loading = input<boolean>(false);

    @Output() completeMethod = new EventEmitter<{ query: string }>();
    @Output() onSelect = new EventEmitter<any>();
    @Output() onUnselect = new EventEmitter<any>();
    @Output() onClear = new EventEmitter<void>();

    @ViewChild('containerEl') containerEl!: ElementRef<HTMLElement>;
    @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;
    @ViewChild('overlay') overlay!: UiOverlayComponent;

    value = signal<any>(null);
    inputValue = signal<string>('');
    focusedIndex = signal<number>(-1);

    private onChange: (value: any) => void = () => { };
    private onTouched: () => void = () => { };

    displayValue = computed(() => {
        const val = this.value();
        if (this.multiple()) {
            return '';
        }
        if (val && this.field()) {
            return val[this.field()!];
        }
        return val ?? '';
    });

    selectedItems = computed(() => {
        const val = this.value();
        if (this.multiple()) {
            return Array.isArray(val) ? val : (val ? [val] : []);
        }
        return [];
    });

    onInput(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.inputValue.set(query);
        this.completeMethod.emit({ query });
        if (!this.overlay.isOpen()) {
            this.openOverlay();
        }
    }

    onFocus(): void {
        if (this.inputValue() || this.suggestions().length > 0) {
            this.openOverlay();
        }
    }

    selectItem(item: any): void {
        if (this.multiple()) {
            const current = this.selectedItems();
            if (!current.includes(item)) {
                const newValue = [...current, item];
                this.value.set(newValue);
                this.onChange(newValue);
                this.onSelect.emit(item);
            }
            this.inputValue.set('');
        } else {
            this.value.set(item);
            this.inputValue.set(this.field() ? item[this.field()!] : item);
            this.onChange(item);
            this.onSelect.emit(item);
            this.closeOverlay();
        }
    }

    removeItem(item: any, event?: Event): void {
        event?.stopPropagation();
        const current = this.selectedItems();
        const newValue = current.filter(i => i !== item);
        this.value.set(newValue);
        this.onChange(newValue);
        this.onUnselect.emit(item);
    }

    openOverlay(): void {
        this.overlay.show();
    }

    closeOverlay(): void {
        this.overlay.hide();
        this.focusedIndex.set(-1);
    }

    toggleOverlay(event: Event): void {
        event.stopPropagation();
        if (this.overlay.isOpen()) {
            this.closeOverlay();
        } else {
            this.openOverlay();
        }
    }

    writeValue(val: any): void {
        this.value.set(val);
        if (!this.multiple() && val) {
            this.inputValue.set(this.field() ? val[this.field()!] : val);
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        // Handle disabled state if needed
    }

    @HostListener('keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (!this.overlay.isOpen()) return;

        switch (event.key) {
            case 'ArrowDown':
                this.focusedIndex.update(i => Math.min(i + 1, this.suggestions().length - 1));
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.focusedIndex.update(i => Math.max(i - 1, 0));
                event.preventDefault();
                break;
            case 'Enter':
                if (this.focusedIndex() >= 0) {
                    this.selectItem(this.suggestions()[this.focusedIndex()]);
                }
                event.preventDefault();
                break;
            case 'Escape':
                this.closeOverlay();
                break;
            case 'Backspace':
                if (this.multiple() && !this.inputValue() && this.selectedItems().length > 0) {
                    this.removeItem(this.selectedItems()[this.selectedItems().length - 1]);
                }
                break;
        }
    }
}
