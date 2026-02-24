import { DOCUMENT } from '@angular/common';
import {
    ApplicationRef,
    createComponent,
    EnvironmentInjector,
    inject,
    Injectable,
    Type,
} from '@angular/core';
import { UiModalComponent } from '../../components/modal/modal.component';
import { ModalOptions, ModalRef } from './modal.types';

/**
 * Service for opening dynamic modals.
 *
 * @example
 * ```ts
 * const ref = this.modalService.open(MyComponent, {
 *   data: { id: 1 },
 *   maxWidth: '600px',
 *   styleClass: 'my-modal',
 *   zIndex: 1000,
 * });
 *
 * const result = await ref.afterClosed();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
    private readonly appRef = inject(ApplicationRef);
    private readonly injector = inject(EnvironmentInjector);
    private readonly document = inject(DOCUMENT);

    /**
     * Opens a modal containing the given `component`.
     *
     * @param component  Any standalone Angular component class.
     * @param options    Optional display and data configuration.
     * @returns          A `ModalRef` to control the modal lifecycle.
     */
    open<C, D = unknown, R = unknown>(
        component: Type<C>,
        options?: ModalOptions<D>,
    ): ModalRef<R> {
        const ref = new ModalRef<R>();

        // --- Create the UiModalComponent dynamically ----------------------------
        const modalComponentRef = createComponent(UiModalComponent, {
            environmentInjector: this.injector,
        });

        // Pass inputs
        modalComponentRef.setInput('contentComponent', component);
        modalComponentRef.setInput('options', options);
        modalComponentRef.setInput('modalRef', ref);

        // Attach to Angular's change-detection tree
        this.appRef.attachView(modalComponentRef.hostView);

        // Append the host element to <body>
        const domElem = (modalComponentRef.hostView as any).rootNodes[0] as HTMLElement;
        this.document.body.appendChild(domElem);

        // --- Cleanup function ---------------------------------------------------
        const destroy = () => {
            // Restore body scroll
            this.document.body.style.overflow = '';

            // Remove from DOM and detach view
            this.appRef.detachView(modalComponentRef.hostView);
            modalComponentRef.destroy();
            if (domElem.parentNode) {
                domElem.parentNode.removeChild(domElem);
            }
        };

        // Register the destroy fn on the ModalRef so the component can trigger it
        ref._destroyFn = destroy;

        // Also clean up if the promise settles (either path)
        ref.afterClosed().then(destroy, destroy);

        return ref;
    }
}
