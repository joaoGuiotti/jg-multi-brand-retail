import { NgClass, NgComponentOutlet, NgStyle } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    inject,
    Injector,
    Input,
    OnInit,
    Type,
} from '@angular/core';
import { MODAL_DATA, MODAL_REF, ModalOptions, ModalRef } from '../../services/modal/modal.types';

let _modalIdCounter = 0;

/**
 * Internal shell component rendered by `ModalService`.
 * Do NOT use this component directly in templates.
 *
 * Provides MODAL_REF and MODAL_DATA via a child Injector so the
 * content component can use inject() without any @Input().
 */
@Component({
    selector: 'ui-modal',
    imports: [NgComponentOutlet, NgClass, NgStyle],
    templateUrl: './modal.component.html',
    styleUrl: './modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiModalComponent implements OnInit {
    /** The component class to render inside the modal panel. */
    @Input() contentComponent!: Type<unknown>;

    /** Options passed from `ModalService.open()`. */
    @Input() options: ModalOptions | undefined;

    /** The ModalRef created by the service — also provided to the content component via the child injector. */
    @Input() modalRef!: ModalRef;

    readonly modalId = `ui-modal-${++_modalIdCounter}`;

    private readonly parentInjector = inject(Injector);

    /**
     * Child injector providing MODAL_REF and MODAL_DATA to the content component.
     * Initialized once in ngOnInit — must NOT be a getter, otherwise Angular's
     * change detection would create a new Injector on every cycle, triggering
     * an infinite rendering loop.
     */
    contentInjector!: Injector;

    /** Computed inline styles for the panel. */
    get panelStyle(): Record<string, string> {
        const opts = this.options;
        const base: Record<string, string> = { ...(opts?.style ?? {}) };
        if (opts?.maxWidth) base['maxWidth'] = opts.maxWidth;
        if (opts?.maxHeight) base['maxHeight'] = opts.maxHeight;
        if (opts?.minWidth) base['minWidth'] = opts.minWidth;
        if (opts?.minHeight) base['minHeight'] = opts.minHeight;
        return base;
    }

    /** Whether the close (✕) button should be rendered. Defaults to `true`. */
    get isClosable(): boolean {
        return this.options?.closable !== false;
    }

    ngOnInit(): void {
        // Build the child injector ONCE — a getter would recreate it on every
        // change-detection cycle, making Angular think inputs changed → infinite loop.
        this.contentInjector = Injector.create({
            parent: this.parentInjector,
            providers: [
                { provide: MODAL_REF, useValue: this.modalRef },
                { provide: MODAL_DATA, useValue: this.options?.data },
            ],
        });

        document.body.style.overflow = 'hidden';
    }

    /** Close (resolve) the modal. */
    close(): void {
        this.modalRef.close();
    }

    /** Handle backdrop click — dismiss only if `dismissOnBackdrop !== false`. */
    onBackdropClick(event: MouseEvent): void {
        if (this.options?.dismissOnBackdrop !== false) {
            this.modalRef.dismiss('backdrop');
        }
    }

    /** Handle global Escape key — dismiss only if `dismissOnEscape !== false`. */
    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.options?.dismissOnEscape !== false) {
            this.modalRef.dismiss('escape');
        }
    }
}
