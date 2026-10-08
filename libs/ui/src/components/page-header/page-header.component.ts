import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UiPageHeaderComponent — Componente padrão de cabeçalho de página do Design System.
 *
 * Uso básico:
 *   <ui-page-header title="Produtos" subtitle="Gerencie o catálogo de produtos.">
 *     <ng-template #actions>
 *       <ui-button variant="primary">Novo Produto</ui-button>
 *     </ng-template>
 *   </ui-page-header>
 *
 * Slots:
 *   - #actions  : projetado à direita do título (botões CTA da página)
 *   - #icon     : ícone SVG opcional exibido à esquerda do título
 */
@Component({
  selector: 'ui-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <!-- Left: icon + title block -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Optional icon slot -->
        @if (iconTpl) {
          <div class="flex-shrink-0 p-2.5 bg-primary rounded-xl text-white shadow-md">
            <ng-container *ngTemplateOutlet="iconTpl"></ng-container>
          </div>
        }
    
        <!-- Title + subtitle -->
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-content-primary leading-tight tracking-tight truncate">
            {{ title }}
            <ng-content select="[titleSuffix]"></ng-content>
          </h1>
          @if (subtitle) {
            <p class="text-xs text-content-tertiary mt-0.5 truncate">{{ subtitle }}</p>
          }
        </div>
      </div>
    
      <!-- Right: actions slot -->
      @if (actionsTpl) {
        <div class="flex items-center gap-3 flex-shrink-0">
          <ng-container *ngTemplateOutlet="actionsTpl"></ng-container>
        </div>
      }
    </div>
    `,
})
export class UiPageHeaderComponent {
  /** Título principal da página (obrigatório) */
  @Input({ required: true }) title!: string;

  /** Subtítulo / descrição curta (opcional) */
  @Input() subtitle?: string;

  /** Slot de ações (botões CTA) — use <ng-template #actions> */
  @ContentChild('actions') actionsTpl?: TemplateRef<unknown>;

  /** Slot de ícone SVG — use <ng-template #icon> */
  @ContentChild('icon') iconTpl?: TemplateRef<unknown>;
}
