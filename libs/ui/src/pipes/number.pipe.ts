import { Pipe, PipeTransform } from '@angular/core';

export interface UiNumberPipeOptions {
    /** BCP 47 locale. Default: 'pt-BR' */
    locale?: string;
    /** Minimum fraction digits. Default: same as decimalPlaces */
    minDecimalPlaces?: number;
    /** Maximum fraction digits. Default: 2 */
    decimalPlaces?: number;
    /** Text prepended before the number. Default: '' */
    prefix?: string;
    /** Text appended after the number. Default: '' */
    suffix?: string;
}

/**
 * Formats a number using Intl.NumberFormat (locale-aware, zero-padded).
 *
 * Usage:
 *   {{ 1234.5  | uiNumber }}                             → '1.234,50'
 *   {{ 1234.5  | uiNumber: { prefix: 'R$ ' } }}          → 'R$ 1.234,50'
 *   {{ 42      | uiNumber: { decimalPlaces: 0 } }}        → '42'
 *   {{ 0.1234  | uiNumber: { decimalPlaces: 4 } }}        → '0,1234'
 *   {{ 99.9    | uiNumber: { suffix: '%', decimalPlaces: 1 } }} → '99,9%'
 */
@Pipe({
    name: 'uiNumber',
    standalone: true,
    pure: true,
})
export class UiNumberPipe implements PipeTransform {

    transform(
        value: number | string | null | undefined,
        options: UiNumberPipeOptions = {}
    ): string {
        if (value === null || value === undefined || value === '') {
            return '';
        }

        const num = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(num)) {
            return '';
        }

        const {
            locale = 'pt-BR',
            decimalPlaces = 2,
            minDecimalPlaces = decimalPlaces,
            prefix = '',
            suffix = '',
        } = options;

        const formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits: minDecimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(num);

        return `${prefix}${formatted}${suffix}`;
    }
}
