import { Injectable, signal, inject, computed } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AuthService } from './auth.service';
import {
  WidgetId,
  DashboardLayout,
  DEFAULT_WIDGET_ORDER,
  VALID_WIDGET_IDS
} from '../models/dashboard-layout.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardLayoutService {
  private authService = inject(AuthService);
  
  // State
  readonly widgetOrder = signal<WidgetId[]>([...DEFAULT_WIDGET_ORDER]);
  readonly isEditMode = signal<boolean>(false);
  
  // Internal backup for cancellation
  private originalOrder: WidgetId[] = [];

  constructor() { }

  /**
   * Loads the layout for the current user from localStorage.
   * Applies fallback logic if invalid or not found.
   */
  loadLayout(): void {
    const user = this.authService.user();
    if (!user) {
      this.widgetOrder.set([...DEFAULT_WIDGET_ORDER]);
      return;
    }

    const key = `dashboard_layout_${user.tenantId}_${user.id}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      this.widgetOrder.set([...DEFAULT_WIDGET_ORDER]);
      return;
    }

    try {
      const layout: DashboardLayout = JSON.parse(stored);
      
      // Validation: Check if it's the correct user/tenant
      if (layout.userId !== user.id || layout.tenantId !== user.tenantId) {
        console.warn('DashboardLayout: Mismatch in user/tenant ID. Using default.');
        this.widgetOrder.set([...DEFAULT_WIDGET_ORDER]);
        return;
      }
      
      // Validation: Filter out unknown widgets
      const validWidgets = layout.widgetOrder.filter(id => VALID_WIDGET_IDS.has(id));
      
      if (validWidgets.length < layout.widgetOrder.length) {
        const removed = layout.widgetOrder.filter(id => !VALID_WIDGET_IDS.has(id));
        console.warn(`DashboardLayout: Filtered out unknown widgets: ${removed.join(', ')}`);
      }
      
      if (validWidgets.length === 0) {
        this.widgetOrder.set([...DEFAULT_WIDGET_ORDER]);
        return;
      }
      
      this.widgetOrder.set(validWidgets);
    } catch (e) {
      console.warn('DashboardLayout: Failed to parse stored layout. Using default.', e);
      this.widgetOrder.set([...DEFAULT_WIDGET_ORDER]);
    }
  }

  /**
   * Enters edit mode, saving the current state for potential cancellation.
   */
  enterEditMode(): void {
    this.originalOrder = [...this.widgetOrder()];
    this.isEditMode.set(true);
  }

  /**
   * Cancels edit mode, restoring the original state.
   */
  cancelEditMode(): void {
    this.widgetOrder.set([...this.originalOrder]);
    this.isEditMode.set(false);
  }

  /**
   * Updates the widget order during drag-and-drop.
   */
  moveWidget(event: CdkDragDrop<WidgetId[]>): void {
    const currentOrder = [...this.widgetOrder()];
    moveItemInArray(currentOrder, event.previousIndex, event.currentIndex);
    this.widgetOrder.set(currentOrder);
  }

  /**
   * Saves the current layout to localStorage.
   */
  saveLayout(): boolean {
    const user = this.authService.user();
    if (!user) {
      console.error('DashboardLayout: Cannot save layout without authenticated user.');
      return false;
    }

    const key = `dashboard_layout_${user.tenantId}_${user.id}`;
    const layout: DashboardLayout = {
      userId: user.id,
      tenantId: user.tenantId,
      widgetOrder: [...this.widgetOrder()],
      savedAt: new Date().toISOString(),
      version: 1
    };

    try {
      localStorage.setItem(key, JSON.stringify(layout));
      this.isEditMode.set(false);
      return true;
    } catch (e) {
      console.error('DashboardLayout: Failed to save to localStorage.', e);
      return false;
    }
  }

  /**
   * Resets the layout to default and clears localStorage.
   */
  resetToDefault(): boolean {
    const user = this.authService.user();
    if (!user) return false;
    
    const key = `dashboard_layout_${user.tenantId}_${user.id}`;
    
    try {
      localStorage.removeItem(key);
      this.widgetOrder.set([...DEFAULT_WIDGET_ORDER]);
      this.isEditMode.set(false);
      return true;
    } catch (e) {
      console.error('DashboardLayout: Failed to remove from localStorage.', e);
      return false;
    }
  }
}
