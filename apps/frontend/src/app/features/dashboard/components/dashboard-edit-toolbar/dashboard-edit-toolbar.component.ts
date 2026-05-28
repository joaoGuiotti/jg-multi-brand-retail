import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-dashboard-edit-toolbar',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './dashboard-edit-toolbar.component.html',
  styleUrl: './dashboard-edit-toolbar.component.scss'
})
export class DashboardEditToolbarComponent {
  @Input() isSaving = false;
  
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  showResetConfirm = signal<boolean>(false);

  onSave() {
    this.save.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  onResetInitiated() {
    this.showResetConfirm.set(true);
  }

  onResetConfirmed() {
    this.showResetConfirm.set(false);
    this.reset.emit();
  }

  onResetCancelled() {
    this.showResetConfirm.set(false);
  }
}
