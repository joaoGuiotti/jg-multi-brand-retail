import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DashboardConnectionState,
  DashboardRecentMovement,
  DashboardRecentSale,
  DashboardSaleCompletedPayload,
  DashboardSnapshotResponse,
  DashboardSseEvent,
  DashboardStockChangedPayload,
} from '../models/dashboard.model';

export interface DashboardChartOptions {
  series: any[];
  chart: any;
  xaxis: any;
  yaxis: any;
  grid: any;
  dataLabels: any;
  stroke: any;
  colors: string[];
  tooltip: any;
  theme?: any;
}

@Injectable()
export class DashboardService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);
  private eventSource: EventSource | null = null;
  private reconnectAttempt = 0;
  private readonly maxReconnectAttempts = 10;
  private reconnectTimeout: any;

  // Signals
  isLoading = signal<boolean>(true);
  isStale = signal<boolean>(false);
  connectionState = signal<DashboardConnectionState>('disconnected');

  revenueToday = signal<number>(0);
  salesToday = signal<number>(0);
  lowStock = signal<number>(0);
  outOfStock = signal<number>(0);
  totalProducts = signal<number>(0);

  recentSales = signal<DashboardRecentSale[]>([]);
  recentMovements = signal<DashboardRecentMovement[]>([]);
  dailyRevenueData = signal<{ date: string; revenue: number }[]>([]);
  chartOptions = signal<DashboardChartOptions | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.closeSSE();
      clearTimeout(this.reconnectTimeout);
    });
  }

  loadSnapshot() {
    this.isLoading.set(true);
    this.http
      .get<{ data: DashboardSnapshotResponse }>(
        `${environment.apiUrl}/dashboard/snapshot`
      )
      .subscribe({
        next: (response) => {
          const data = response.data;
          this.revenueToday.set(data.kpis.revenueToday);
          this.salesToday.set(data.kpis.salesToday);
          this.lowStock.set(data.kpis.lowStock);
          this.outOfStock.set(data.kpis.outOfStock);
          this.totalProducts.set(data.kpis.totalProducts);

          this.recentSales.set(data.recentSales);
          this.recentMovements.set(data.recentMovements);

          // Render chart after initial load using the snapshot data
          this.dailyRevenueData.set(data.dailyRevenue);
          this.setupChart(data.dailyRevenue);

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load dashboard snapshot', err);
          this.isLoading.set(false);
        },
      });
  }

  connectSSE() {
    if (this.eventSource) {
      this.closeSSE();
    }

    const token = localStorage.getItem('access_token');
    const url = `${environment.apiUrl}/api/v1/notifications/stream`;

    this.eventSource = new EventSource(url + (token ? `?token=${token}` : ''));

    this.eventSource.onopen = () => {
      this.reconnectAttempt = 0;
      this.connectionState.set('connected');
      this.isStale.set(false);
    };

    this.eventSource.onmessage = (messageEvent) => {
      this.zone.run(() => {
        try {
          const parsed = JSON.parse(messageEvent.data);
          const sseEvent =
            typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
          
          // Resilience: if the event is double-wrapped in { data: { type: ... } }
          const finalEvent = sseEvent.data && sseEvent.data.type ? sseEvent.data : sseEvent;
            
          this.handleEvent(finalEvent as DashboardSseEvent);
        } catch (e) {
          console.warn('Failed to parse SSE message', e, messageEvent.data);
        }
      });
    };

    this.eventSource.onerror = () => {
      this.closeSSE();
      this.handleReconnect();
    };
  }

  startChartAutoRefresh() {
    // interval starts AFTER the specified time (initial is handled by loadSnapshot)
    interval(5 * 60 * 1000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.http.get<any>(`${environment.apiUrl}/sales/reports/daily-revenue?days=7`)),
        map(response => response.data || response),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe({
        next: (chartData) => {
          this.dailyRevenueData.set(chartData);
          this.setupChart(chartData);
        },
        error: (err) => {
          console.warn('Failed to refresh chart data', err);
        },
      });
  }

  private setupChart(data: any[]) {
    const isDark = document.body.classList.contains('dark-theme');
    const textColorSecondary = isDark ? '#a0a0a0' : '#6c757d';
    const surfaceBorder = isDark ? '#404040' : '#dfe7ef';

    this.chartOptions.set({
      series: [
        {
          name: 'Receita',
          data: data.map((d: any) => d.revenue),
        },
      ],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        background: 'transparent',
      },
      colors: ['#4ade80'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: data.map((d: any) => d.date),
        labels: { style: { colors: textColorSecondary } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: textColorSecondary },
          formatter: (value: number) => `R$ ${value.toFixed(2)}`,
        },
      },
      grid: {
        borderColor: surfaceBorder,
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: (val: number) => `R$ ${val.toFixed(2)}` },
      },
    });
  }

  private handleEvent(event: DashboardSseEvent) {
    if (event.type === 'dashboard.sale_completed') {
      const payload = event.payload as DashboardSaleCompletedPayload;
      this.salesToday.update((v) => v + 1);
      this.revenueToday.update((v) => v + payload.total);

      const newSale: DashboardRecentSale = {
        id: payload.saleId,
        total: payload.total,
        status: payload.status,
        createdAt: payload.createdAt,
        customerId: payload.customerId,
        itemCount: payload.itemCount,
      };

      this.recentSales.update((list) => [newSale, ...list].slice(0, 6));
      
      // Update Daily Revenue Chart reactively
      const currentData = [...this.dailyRevenueData()];
      if (currentData.length > 0) {
        const todayStr = new Date(payload.createdAt).toISOString().split('T')[0];
        const todayIndex = currentData.findIndex((d) => d.date === todayStr);
        if (todayIndex !== -1) {
          currentData[todayIndex] = {
            ...currentData[todayIndex],
            revenue: currentData[todayIndex].revenue + payload.total,
          };
        } else {
          currentData.push({ date: todayStr, revenue: payload.total });
        }
        this.dailyRevenueData.set(currentData);
        this.setupChart(currentData);
      }
    } else if (event.type === 'dashboard.stock_changed') {
      const payload = event.payload as DashboardStockChangedPayload;

      if (payload.newStockLevel === 0) {
        this.outOfStock.update((v) => v + 1);
        this.lowStock.update((v) => Math.max(0, v - 1));
      } else if (payload.newStockLevel > 0 && payload.newStockLevel <= 10) {
        if (payload.movementType === 'EXIT') {
          this.lowStock.update((v) => v + 1);
        } else if (
          payload.movementType === 'ENTRY' ||
          payload.movementType === 'RETURN'
        ) {
          this.outOfStock.update((v) => Math.max(0, v - 1));
          this.lowStock.update((v) => v + 1);
        }
      }

      const newMovement: DashboardRecentMovement = {
        id: crypto.randomUUID(),
        productId: payload.productId,
        productName: payload.productName,
        type: payload.movementType,
        quantity: payload.quantity,
        createdAt: payload.createdAt,
      };

      this.recentMovements.update((list) => [newMovement, ...list].slice(0, 6));
    }
  }

  private handleReconnect() {
    this.isStale.set(true);

    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.connectionState.set('disconnected');
      return;
    }

    this.connectionState.set('reconnecting');
    const backoffTime = Math.min(2 ** this.reconnectAttempt * 1000, 30000);
    this.reconnectAttempt++;

    this.reconnectTimeout = setTimeout(() => {
      this.connectSSE();
      this.loadSnapshot(); // refresh stale data
    }, backoffTime);
  }

  private closeSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
