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

        const cleanValue = value.replace(/\D/g, '');

        if (cleanValue.length === 11) {
            return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }

        if (cleanValue.length === 14) {
            return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }

        // For Alphanumeric CNPJ, we might have letters, so we shouldn't just replace digits.
        // If the user wants "CNPJ Alfa", we should handle alphanumeric characters too.
        const alphanumeric = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (alphanumeric.length === 11) {
            return alphanumeric.replace(/([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{2})/, '$1.$2.$3-$4');
        }

        if (alphanumeric.length === 14) {
            return alphanumeric.replace(/([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})([A-Z0-9]{2})/, '$1.$2.$3/$4-$5');
        }

        return value;
    }
}
