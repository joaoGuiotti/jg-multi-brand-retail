import { Directive, ElementRef, HostListener, input } from "@angular/core";



@Directive({
    selector: '[uiNumber]',
    standalone: true
})
export class NumberDirective {
    thousandSeparator = input<string>('.');
    decimalSeparator = input<string>(',');
    decimalPlaces = input<number>(2);

    constructor(private el: ElementRef) { }

    @HostListener('input', ['$event'])
    onInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const regex = /^[0-9]*$/;
        if (!regex.test(value)) {
            input.value = value.replace(/[^0-9]/g, '');
        }
    }
}