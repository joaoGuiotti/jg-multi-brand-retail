import {
  ConnectedOverlayPositionChange,
  ConnectionPositionPair,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { Component, ComponentRef, Directive, ElementRef, HostListener, inject, Input, OnDestroy, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'ui-tooltip-content',
  standalone: true,
  template: `
    <div class="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
      {{ content }}
    </div>
  `,
  imports: [CommonModule],
  styles: [`
    :host { display: block; z-index: 1000; pointer-events: none; }
  `]
})
export class UiTooltipContentComponent {
  @Input() content = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'right';
}

@Directive({
  selector: '[uiTooltip]',
  standalone: true
})
export class UiTooltipDirective implements OnDestroy {
  @Input('uiTooltip') content = '';
  @Input() uiTooltipDisabled = false;
  @Input() uiTooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'right';

  private overlay = inject(Overlay);
  private elementRef = inject(ElementRef);
  private viewContainerRef = inject(ViewContainerRef);

  private overlayRef: OverlayRef | null = null;
  private componentRef: ComponentRef<UiTooltipContentComponent> | null = null;

  @HostListener('mouseenter')
  show(): void {
    if (this.uiTooltipDisabled || !this.content) return;

    if (!this.overlayRef) {
      const config = this.getOverlayConfig();
      this.overlayRef = this.overlay.create(config);

      const positionStrategy = config.positionStrategy as FlexibleConnectedPositionStrategy;
      positionStrategy.positionChanges.subscribe(change => {
        if (this.componentRef) {
          this.updatePosition(change);
        }
      });
    }

    const portal = new ComponentPortal(UiTooltipContentComponent, this.viewContainerRef);
    this.componentRef = this.overlayRef.attach(portal);
    this.componentRef.instance.content = this.content;

    // Initial position based on priority or default
    this.componentRef.instance.position = this.uiTooltipPosition;
  }

  private updatePosition(change: ConnectedOverlayPositionChange): void {
    const { connectionPair } = change;
    let position: 'top' | 'bottom' | 'left' | 'right' = 'right';

    if (connectionPair.originY === 'top' && connectionPair.overlayY === 'bottom') {
      position = 'top';
    } else if (connectionPair.originY === 'bottom' && connectionPair.overlayY === 'top') {
      position = 'bottom';
    } else if (connectionPair.originX === 'start' && connectionPair.overlayX === 'end') {
      position = 'left';
    } else if (connectionPair.originX === 'end' && connectionPair.overlayX === 'start') {
      position = 'right';
    }

    if (this.componentRef) {
      this.componentRef.instance.position = position;
      this.componentRef.changeDetectorRef.markForCheck();
    }
  }

  @HostListener('mouseleave')
  hide(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.componentRef = null;
    }
  }

  ngOnDestroy(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private getOverlayConfig(): OverlayConfig {
    const positions = this.getPositions();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions)
      .withPush(true);

    return new OverlayConfig({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
  }

  private getPositions(): ConnectionPositionPair[] {
    const strategy: Record<'top' | 'bottom' | 'left' | 'right', ConnectionPositionPair> = {
      top: new ConnectionPositionPair(
        { originX: 'center', originY: 'top' },
        { overlayX: 'center', overlayY: 'bottom' },
        0, -8
      ),
      bottom: new ConnectionPositionPair(
        { originX: 'center', originY: 'bottom' },
        { overlayX: 'center', overlayY: 'top' },
        0, 8
      ),
      left: new ConnectionPositionPair(
        { originX: 'start', originY: 'center' },
        { overlayX: 'end', overlayY: 'center' },
        -8, 0
      ),
      right: new ConnectionPositionPair(
        { originX: 'end', originY: 'center' },
        { overlayX: 'start', overlayY: 'center' },
        8, 0
      )
    };

    const priorities: ('top' | 'bottom' | 'left' | 'right')[] = [
      this.uiTooltipPosition,
      ...(['right', 'bottom', 'top', 'left'] as const).filter(p => p !== this.uiTooltipPosition)
    ];

    return priorities.map(p => strategy[p]);
  }
}
