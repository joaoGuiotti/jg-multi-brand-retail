import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DestroyRef } from '@angular/core';
import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: any;
  onmessage: any;
  onerror: any;
  
  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }

  close() {
    MockEventSource.instances = MockEventSource.instances.filter(i => i !== this);
  }

  triggerMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  triggerOpen() {
    if (this.onopen) this.onopen();
  }

  triggerError() {
    if (this.onerror) this.onerror();
  }
}

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Override global EventSource for testing
    (window as any).EventSource = MockEventSource;
    MockEventSource.instances = [];

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: DestroyRef,
          useValue: { onDestroy: jasmine.createSpy('onDestroy') }
        }
      ]
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    MockEventSource.instances = [];
  });

  it('should load snapshot and populate signals', () => {
    service.loadSnapshot();

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/snapshot`);
    expect(req.request.method).toBe('GET');

    const mockResponse = {
      data: {
        kpis: { revenueToday: 1000, salesToday: 10, lowStock: 2, outOfStock: 1, totalProducts: 50 },
        recentSales: [{ id: 's1', total: 100, status: 'COMPLETED', createdAt: '2026-04-20', customerId: null, itemCount: 2 }],
        recentMovements: [],
        dailyRevenue: []
      }
    };

    req.flush(mockResponse);

    expect(service.revenueToday()).toBe(1000);
    expect(service.salesToday()).toBe(10);
    expect(service.isLoading()).toBe(false);
    expect(service.recentSales().length).toBe(1);
  });

  it('should connect to SSE and handle dashboard.sale_completed event', () => {
    service.connectSSE();
    const mockES = MockEventSource.instances[0];
    
    expect(mockES).toBeDefined();
    mockES.triggerOpen();
    expect(service.connectionState()).toBe('connected');

    const lastSalesToday = service.salesToday();
    const lastRevenueToday = service.revenueToday();

    mockES.triggerMessage({
      type: 'dashboard.sale_completed',
      payload: {
        saleId: 's2',
        total: 50,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        customerId: null,
        itemCount: 1
      }
    });

    expect(service.salesToday()).toBe(lastSalesToday + 1);
    expect(service.revenueToday()).toBe(lastRevenueToday + 50);
    expect(service.recentSales()[0].id).toBe('s2');
  });

});
