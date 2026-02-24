// ── Modal Types ───────────────────────────────────────────────────────────────
import { InjectionToken } from '@angular/core';

/**
 * InjectionToken that provides the `ModalRef` to the dynamically opened component.
 *
 * @example
 * ```ts
 * private modalRef = inject(MODAL_REF) as ModalRef<MyResult>;
 * ```
 */
export const MODAL_REF = new InjectionToken<ModalRef>('MODAL_REF');

/**
 * InjectionToken that provides the `data` passed via `ModalOptions.data`
 * to the dynamically opened component.
 *
 * @example
 * ```ts
 * readonly data = inject(MODAL_DATA) as MyData;
 * ```
 */
export const MODAL_DATA = new InjectionToken<unknown>('MODAL_DATA');


export interface ModalOptions<D = unknown> {
    /** Optional data passed to the dynamic content component via `data` input. */
    data?: D;
    /** Title displayed in the modal header. If omitted, no header is rendered. */
    title?: string;
    /** Whether the close (✕) button is visible. Defaults to `true`. */
    closable?: boolean;
    /** Inline CSS styles applied directly to the modal panel element. */
    style?: Record<string, string>;
    /** Extra CSS classes appended to the modal panel element. */
    styleClass?: string;
    /** CSS `max-width` of the modal panel (e.g. `'600px'`, `'90vw'`). */
    maxWidth?: string;
    /** CSS `max-height` of the modal panel (e.g. `'80vh'`, `'600px'`). */
    maxHeight?: string;
    /** CSS `min-width` of the modal panel. */
    minWidth?: string;
    /** CSS `min-height` of the modal panel. */
    minHeight?: string;
    /** Stack order of the modal overlay. Defaults to `1000`. */
    zIndex?: number;
    /** Whether clicking the backdrop dismisses the modal. Defaults to `true`. */
    dismissOnBackdrop?: boolean;
    /** Whether pressing Escape dismisses the modal. Defaults to `true`. */
    dismissOnEscape?: boolean;
}

// ── Modal Reference ───────────────────────────────────────────────────────────

/**
 * A handle returned by `ModalService.open()`.
 *
 * ```ts
 * const ref = this.modalService.open(MyComponent, { data: { id: 1 } });
 * const result = await ref.afterClosed();
 * ```
 */
export class ModalRef<R = unknown> {
    private _resolve!: (value: R | undefined) => void;
    private _reject!: (reason?: unknown) => void;
    private readonly _promise: Promise<R | undefined>;

    /** @internal – called by the ModalService to trigger destruction. */
    _destroyFn: (() => void) | null = null;

    constructor() {
        this._promise = new Promise<R | undefined>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    /**
     * Closes the modal and resolves `afterClosed()` with an optional result.
     */
    close(result?: R): void {
        this._destroyFn?.();
        this._resolve(result);
    }

    /**
     * Dismisses the modal without a result and rejects `afterClosed()`.
     */
    dismiss(reason?: unknown): void {
        this._destroyFn?.();
        this._reject(reason);
    }

    /**
     * Returns a promise that resolves when the modal is closed,
     * or rejects when it is dismissed.
     */
    afterClosed(): Promise<R | undefined> {
        return this._promise;
    }
}
