import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyStore } from '../../store/loyalty.store';
import { UiButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-loyalty-badge',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './loyalty-badge.component.html',
  styleUrl: './loyalty-badge.component.scss'
})
export class LoyaltyBadgeComponent {
  protected store = inject(LoyaltyStore);
  
  @Output() redeemClick = new EventEmitter<void>();

  onRedeem(): void {
    if (this.store.canRedeem()) {
      this.redeemClick.emit();
    }
  }
}
