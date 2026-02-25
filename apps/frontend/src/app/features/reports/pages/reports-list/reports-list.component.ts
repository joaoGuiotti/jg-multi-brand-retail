import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { ThemeService, UiCardComponent } from '@shared/ui';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { SalesService } from '../../../../core/services/sales.service';

@Component({
    selector: 'app-reports-list',
    standalone: true,
    imports: [CommonModule, UiCardComponent, NgApexchartsModule],
    templateUrl: './reports-list.component.html',
    styleUrl: './reports-list.component.scss'
})
export class ReportsListComponent implements OnInit {
    private salesService = inject(SalesService);
    private themeService = inject(ThemeService);

    isLoading = signal(true);
    revenueChartOptions = signal<ApexOptions | null>(null);

    constructor() {
        effect(() => {
            const theme = this.themeService.theme();
            untracked(() => {
                const currentOptions = this.revenueChartOptions();
                if (currentOptions) {
                    this.revenueChartOptions.set({
                        ...currentOptions,
                        theme: {
                            mode: theme
                        },
                        tooltip: {
                            ...currentOptions.tooltip,
                            theme: theme
                        },
                        grid: {
                            ...currentOptions.grid,
                            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'
                        }
                    });
                }
            });
        });
    }

    ngOnInit(): void {
        this.loadDailyRevenue();
    }

    loadDailyRevenue(): void {
        this.salesService.getDailyRevenueReport(30).subscribe({
            next: (response: any) => {
                if (response && response.data) {
                    this.setupRevenueChart(response.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    setupRevenueChart(data: { date: string; revenue: number }[]): void {
        const categories = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });

        const series = data.map(d => d.revenue);

        this.revenueChartOptions.set({
            series: [{
                name: 'Revenue',
                data: series
            }],
            chart: {
                type: 'area',
                height: 350,
                toolbar: { show: true },
                zoom: { enabled: false },
                fontFamily: 'inherit',
                background: 'transparent'
            },
            theme: {
                mode: this.themeService.theme()
            },
            colors: ['#3b82f6'], // Primary blue
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            xaxis: {
                categories: categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    },
                    formatter: (val: number) => this.formatCurrency(val)
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.45,
                    opacityTo: 0.05,
                    stops: [20, 100]
                }
            },
            tooltip: {
                theme: this.themeService.theme(),
                y: {
                    formatter: (val: number) => this.formatCurrency(val)
                }
            },
            grid: {
                borderColor: this.themeService.theme() === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                strokeDashArray: 4,
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            }
        });
    }
}
