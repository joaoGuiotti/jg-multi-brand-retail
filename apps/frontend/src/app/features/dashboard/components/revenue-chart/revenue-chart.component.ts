
import { Component, Input } from '@angular/core';
import { UiCardComponent } from '@shared/ui';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
    selector: 'app-revenue-chart',
    standalone: true,
    imports: [UiCardComponent, NgApexchartsModule],
    template: `
    <ui-card [shadow]="true" padding="md" class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold text-content">Daily Revenue</h2>
          <p class="text-sm text-content-secondary">Last 7 days performance</p>
        </div>
      </div>

      @if (chartOptions) {
        <div class="h-[280px]">
          <apx-chart 
            [series]="chartOptions.series" 
            [chart]="chartOptions.chart" 
            [xaxis]="chartOptions.xaxis"
            [yaxis]="chartOptions.yaxis" 
            [stroke]="chartOptions.stroke" 
            [tooltip]="chartOptions.tooltip"
            [dataLabels]="chartOptions.dataLabels" 
            [colors]="chartOptions.colors" 
            [fill]="chartOptions.fill"
            [grid]="chartOptions.grid" 
            [theme]="chartOptions.theme">
          </apx-chart>
        </div>
      } @else {
        <div class="h-[280px] w-full bg-surface-alt rounded animate-pulse"></div>
      }
    </ui-card>
  `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class RevenueChartComponent {
    @Input() chartOptions: any;
}
