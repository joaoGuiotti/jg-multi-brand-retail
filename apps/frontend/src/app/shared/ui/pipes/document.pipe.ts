import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a string as CPF or CNPJ.
 *
 * Usage:
 *   {{ '12345678901' | uiDocument }} → '123.456.789-01'
 *   {{ '12345678000190' | uiDocument }} → '12.345.678/0001-90'
 */
@Pipe({
    name: 'uiDocument',
    standalone: true,
    pure: true,
})
export class UiDocumentPipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '';

        const alphanumeric = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (alphanumeric.length === 11) {
            // CPF: 000.000.000-00
            return alphanumeric.replace(/([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{2})/, '$1.$2.$3-$4');
        }

        if (alphanumeric.length === 14) {
            // CNPJ: AA.AAA.AAA/AAAA-AA
            return alphanumeric.replace(/([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})([A-Z0-9]{2})/, '$1.$2.$3/$4-$5');
        }

        return value;
    }
}
