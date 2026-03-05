import { MaskitoOptions } from '@maskito/core';

export const UI_DOCUMENT_MASK: MaskitoOptions = {
    mask: ({ value }) => {
        const cleanValue = value.replace(/[^A-Z0-9]/gi, '');

        if (cleanValue.length <= 11 && !(/[A-Z]/i.test(cleanValue))) {
            // CPF: 000.000.000-00 (Only numeric)
            return [
                /[0-9]/, /[0-9]/, /[0-9]/, '.',
                /[0-9]/, /[0-9]/, /[0-9]/, '.',
                /[0-9]/, /[0-9]/, /[0-9]/, '-',
                /[0-9]/, /[0-9]/
            ];
        } else {
            // CNPJ (Alfa): AA.AAA.AAA/AAAA-AA
            // Or CPF Alphanumeric (if ever needed, but here focusing on CNPJ standards)
            return [
                /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, '.',
                /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, '.',
                /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, '/',
                /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, /[a-zA-Z0-9]/, '-',
                /[0-9]/, /[0-9]/
            ];
        }
    },
    preprocessors: [
        ({ elementState, data }) => {
            const { value, selection } = elementState;
            // Only allow letters and digits
            return {
                elementState: {
                    selection,
                    value: value.toUpperCase(),
                },
                data: data.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            };
        },
    ],
};
