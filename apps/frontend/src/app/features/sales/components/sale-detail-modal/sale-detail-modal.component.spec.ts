import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaleDetailModalComponent } from './sale-detail-modal.component';
import { SalesService } from '../../../../core/services/sales.service';
import { Router } from '@angular/router';
import { MODAL_DATA, MODAL_REF } from '@shared/ui';
import { of, throwError } from 'rxjs';
import { Sale } from '../../../../core/models/sale.model';

describe('SaleDetailModalComponent', () => {
  let component: SaleDetailModalComponent;
  let fixture: ComponentFixture<SaleDetailModalComponent>;
  let mockSalesService: any;
  let mockRouter: any;
  let mockModalRef: any;

  const mockSale: Sale = {
    id: 'sale-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    invoiceNumber: 'INV-1',
    status: 'COMPLETED',
    subtotal: 100,
    discount: 0,
    total: 100,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payments: [],
    returns: [],
  };

  beforeEach(async () => {
    mockSalesService = {
      getSale: vi
        .fn()
        .mockName('getSale')
        .mockReturnValue(of({ data: mockSale })),
      getReceipt: vi.fn().mockName('getReceipt').mockReturnValue(of(new Blob())),
    };

    mockRouter = {
      navigate: vi.fn().mockName('navigate'),
    };

    mockModalRef = {
      close: vi.fn().mockName('close'),
    };

    await TestBed.configureTestingModule({
      imports: [SaleDetailModalComponent],
      providers: [
        { provide: SalesService, useValue: mockSalesService },
        { provide: Router, useValue: mockRouter },
        { provide: MODAL_REF, useValue: mockModalRef },
        { provide: MODAL_DATA, useValue: 'sale-1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaleDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sale details on init', () => {
    expect(mockSalesService.getSale).toHaveBeenCalledWith('sale-1');
    expect(component.sale()).toEqual(mockSale);
    expect(component.isLoading()).toBe(false);
  });

  it('should set error message if loading fails', () => {
    mockSalesService.getSale.mockReturnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.loadSaleDetails();
    expect(component.errorMessage()).toBe('Error');
  });

  it('should close modal', () => {
    component.close();
    expect(mockModalRef.close).toHaveBeenCalled();
  });

  it('should return true for hasPendingReturns if a return is REQUESTED or APPROVED', () => {
    component.sale.set({
      ...mockSale,
      returns: [{ id: '1', status: 'REQUESTED', total: 10, createdAt: new Date().toISOString() }],
    });
    expect(component.hasPendingReturns()).toBe(true);

    component.sale.set({
      ...mockSale,
      returns: [{ id: '2', status: 'APPROVED', total: 10, createdAt: new Date().toISOString() }],
    });
    expect(component.hasPendingReturns()).toBe(true);
  });

  it('should return false for hasPendingReturns if returns are REFUNDED or REJECTED', () => {
    component.sale.set({
      ...mockSale,
      returns: [{ id: '1', status: 'REFUNDED', total: 10, createdAt: new Date().toISOString() }],
    });
    expect(component.hasPendingReturns()).toBe(false);

    component.sale.set({
      ...mockSale,
      returns: [{ id: '2', status: 'REJECTED', total: 10, createdAt: new Date().toISOString() }],
    });
    expect(component.hasPendingReturns()).toBe(false);
  });

  it('should navigate to initiate return', () => {
    component.initiateReturn();
    expect(mockModalRef.close).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/returns/new'], {
      queryParams: { saleId: 'sale-1' },
    });
  });

  it('should download receipt', () => {
    const mockUrl = 'blob:url';
    const createUrlSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl);
    const revokeUrlSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockReturnValue(undefined);
    const mockClick = vi.fn().mockName('click');
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string, options?: any) => {
        if (tagName === 'a') {
          return { click: mockClick } as any;
        }
        return originalCreateElement(tagName, options);
      });

    try {
      component.onPrint();

      expect(mockSalesService.getReceipt).toHaveBeenCalledWith('sale-1');
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    } finally {
      createElementSpy.mockRestore();
      createUrlSpy.mockRestore();
      revokeUrlSpy.mockRestore();
    }
  });

  it('should calculate totalRefunded correctly across multiple returns', () => {
    component.sale.set({
      ...mockSale,
      returns: [
        { id: 'ret-1', status: 'REFUNDED', total: 50, createdAt: new Date().toISOString() },
        { id: 'ret-2', status: 'REFUNDED', total: 35.5, createdAt: new Date().toISOString() },
      ],
    });
    expect(component.totalRefunded()).toBe(85.5);
  });

  it('should toggle return expansion state', () => {
    // Default is expanded (true)
    expect(component.isReturnExpanded('ret-1')).toBe(true);

    // Toggle to collapse
    component.toggleReturnExpansion('ret-1');
    expect(component.isReturnExpanded('ret-1')).toBe(false);

    // Toggle back to expand
    component.toggleReturnExpansion('ret-1');
    expect(component.isReturnExpanded('ret-1')).toBe(true);
  });

  it('should return correct status and condition labels/variants', () => {
    expect(component.getReturnStatusVariant('REFUNDED')).toBe('success');
    expect(component.getReturnStatusVariant('APPROVED')).toBe('info');
    expect(component.getReturnStatusVariant('REQUESTED')).toBe('warning');
    expect(component.getReturnStatusVariant('REJECTED')).toBe('error');

    expect(component.getItemConditionVariant('GOOD')).toBe('success');
    expect(component.getItemConditionVariant('DAMAGED')).toBe('warning');
    expect(component.getItemConditionVariant('DEFECTIVE')).toBe('error');

    expect(component.getItemConditionLabel('GOOD')).toBe('Bom Estado');
    expect(component.getItemConditionLabel('DAMAGED')).toBe('Avariado');
    expect(component.getItemConditionLabel('DEFECTIVE')).toBe('Defeito');

    expect(component.getRefundTypeLabel('STORE_CREDIT')).toBe('Crédito em Loja');
    expect(component.getRefundTypeLabel('CASH_REFUND')).toBe('Estorno Financeiro');
    expect(component.getRefundTypeLabel('EXCHANGE')).toBe('Troca de Produto');
  });

  it('should render detailed return items in DOM when returns exist', () => {
    component.sale.set({
      ...mockSale,
      returns: [
        {
          id: 'ret-full-1',
          status: 'REFUNDED',
          refundType: 'STORE_CREDIT',
          reason: 'Produto com defeito no fecho',
          total: 80,
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 'ret-item-1',
              productId: 'p1',
              productName: 'Camiseta Silk',
              sku: 'CAM-001',
              quantity: 2,
              unitPrice: 40,
              total: 80,
              condition: 'DEFECTIVE',
            },
          ],
        },
      ],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Devoluções Associadas');
    expect(compiled.textContent).toContain('Camiseta Silk');
    expect(compiled.textContent).toContain('SKU: CAM-001');
    expect(compiled.textContent).toContain('Produto com defeito no fecho');
  });

  it('should not render returns section when sale has no returns', () => {
    component.sale.set({
      ...mockSale,
      returns: [],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Devoluções Associadas');
  });

  it('should render ui-loading when isLoading is true', () => {
    component.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const loadingElem = compiled.querySelector('ui-loading');
    expect(loadingElem).toBeTruthy();
  });

  it('should render ui-table and ui-badges for returns and returned items', () => {
    component.sale.set({
      ...mockSale,
      returns: [
        {
          id: 'ret-ui-1',
          status: 'REFUNDED',
          refundType: 'CASH_REFUND',
          total: 100,
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 'ret-item-ui-1',
              productId: 'p2',
              productName: 'Calça Jeans',
              sku: 'JNS-002',
              quantity: 1,
              unitPrice: 100,
              total: 100,
              condition: 'GOOD',
            },
          ],
        },
      ],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Verify ui-table instances exist
    const tables = compiled.querySelectorAll('ui-table');
    expect(tables.length).toBeGreaterThanOrEqual(2); // main items table + returns table

    // Verify badges exist
    const badges = compiled.querySelectorAll('ui-badge');
    expect(badges.length).toBeGreaterThanOrEqual(3);

    expect(compiled.textContent).toContain('Calça Jeans');
    expect(compiled.textContent).toContain('JNS-002');
    expect(compiled.textContent).toContain('Bom Estado');
    expect(compiled.textContent).toContain('Estorno Financeiro');
  });
});
