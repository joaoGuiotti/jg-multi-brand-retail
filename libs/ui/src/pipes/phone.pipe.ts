import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'uiPhone',
    standalone: true
})
export class UiPhonePipe implements PipeTransform {
    transform(value: string | number | null | undefined): string {
        if (value === null || value === undefined) return '';

        const stringValue = value.toString().replace(/\D/g, '');

        if (stringValue.length === 11) {
            // (00) 00000-0000
            return `(${stringValue.substring(0, 2)}) ${stringValue.substring(2, 7)}-${stringValue.substring(7)}`;
        } else if (stringValue.length === 10) {
            // (00) 0000-0000
            return `(${stringValue.substring(0, 2)}) ${stringValue.substring(2, 6)}-${stringValue.substring(6)}`;
        }

        return value.toString();
    }
}
