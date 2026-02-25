import { Directive, input, TemplateRef } from '@angular/core';

@Directive({
    selector: '[uiTableColumn]',
    standalone: true,
})
export class UiTableColumnDirective<T = any> {
    key = input.required<string>({ alias: 'uiTableColumn' });

    constructor(public template: TemplateRef<{ $implicit: T; row: T }>) { }
}
