
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    inject,
    input,
    Output,
    signal,
    TemplateRef,
    ViewChild,
    ViewContainerRef
} from '@angular/core';

@Component({
    selector: 'ui-overlay',
    standalone: true,
    imports: [CommonModule, OverlayModule],
    template: `
        <ng-template #overlayTemplate>
            <div 
                class="ui-overlay-panel" 
                [ngClass]="panelClass()"
                (click)="$event.stopPropagation()"
            >
                <ng-content></ng-content>
            </div>
        </ng-template>
    `,
    styles: [`
        .ui-overlay-panel {
            width: 100%;
            background: var(--color-bg-primary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            margin-top: 4px;
            z-index: 1000;
            animation: panel-in 0.2s cubic-bezier(0, 0, 0.2, 1);
        }

        @keyframes panel-in {
            from {
                opacity: 0;
                transform: translateY(-8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiOverlayComponent {
    target = input<ElementRef | HTMLElement | null>(null);
    width = input<string | number | 'target'>('target');
    dismissable = input<boolean>(true);
    panelClass = input<string>('');

    @Output() onOpen = new EventEmitter<void>();
    @Output() onClose = new EventEmitter<void>();

    @ViewChild('overlayTemplate') overlayTemplate!: TemplateRef<any>;

    isOpen = signal<boolean>(false);

    private overlay = inject(Overlay);
    private viewContainerRef = inject(ViewContainerRef);
    private overlayRef: OverlayRef | null = null;

    show(): void {
        if (this.isOpen()) return;

        const targetEl = this.target();
        if (!targetEl) {
            console.warn('UiOverlayComponent: No target element provided.');
            return;
        }

        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(targetEl)
            .withPositions([
                {
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top',
                    offsetY: 4
                },
                {
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'bottom',
                    offsetY: -4
                }
            ])
            .withPush(false);

        let overlayWidth: string | number = 'auto';
        if (this.width() === 'target') {
            const rawEl = targetEl instanceof ElementRef ? targetEl.nativeElement : targetEl;
            overlayWidth = rawEl.offsetWidth;
        } else {
            overlayWidth = this.width();
        }

        this.overlayRef = this.overlay.create({
            positionStrategy: strategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            hasBackdrop: this.dismissable(),
            backdropClass: 'cdk-overlay-transparent-backdrop',
            width: overlayWidth
        });

        if (this.dismissable()) {
            this.overlayRef.backdropClick().subscribe(() => this.hide());
        }

        const portal = new TemplatePortal(this.overlayTemplate, this.viewContainerRef);
        this.overlayRef.attach(portal);
        this.isOpen.set(true);
        this.onOpen.emit();
    }

    hide(): void {
        if (!this.isOpen()) return;

        if (this.overlayRef) {
            this.overlayRef.detach();
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
        this.isOpen.set(false);
        this.onClose.emit();
    }

    toggle(): void {
        if (this.isOpen()) {
            this.hide();
        } else {
            this.show();
        }
    }
}
