import { Directive, Input } from '@angular/core';
import { MaskitoDirective } from '@maskito/angular';
import { MaskitoOptions } from '@maskito/core';

import { UI_DOCUMENT_MASK } from './document-mask.options';

@Directive({
    selector: 'input[uiDocumentMask]',
    standalone: true,
    hostDirectives: [
        {
            directive: MaskitoDirective,
            inputs: ['maskito: uiDocumentMask'],
        },
    ],
})
export class UiDocumentMaskDirective {
    @Input() uiDocumentMask: MaskitoOptions | '' = UI_DOCUMENT_MASK;
}
