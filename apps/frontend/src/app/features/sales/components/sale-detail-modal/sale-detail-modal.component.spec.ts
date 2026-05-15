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
    returns: []
  };

  beforeEach(async () => {
    mockSalesService = {
      getSale: jasmine.createSpy('getSale').and.returnValue(of({ data: mockSale })),
      getReceipt: jasmine.createSpy('getReceipt').and.returnValue(of(new Blob()))
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockModalRef = {
      close: jasmine.createSpy('close')
    };

    await TestBed.configureTestingModule({
      imports: [SaleDetailModalComponent],
      providers: [
        { provide: SalesService, useValue: mockSalesService },
        { provide: Router, useValue: mockRouter },
        { provide: MODAL_REF, useValue: mockModalRef },
        { provide: MODAL_DATA, useValue: 'sale-1' }
      ]
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
    expect(component.isLoading()).toBeFalse();
  });

  it('should set error message if loading fails', () => {
    mockSalesService.getSale.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.loadSaleDetails();
    expect(component.errorMessage()).toBe('Error');
  });

  it('should close modal', () => {
    component.close();
    expect(mockModalRef.close).toHaveBeenCalled();
  });

  it('should return true for hasPendingReturns if a return is REQUESTED or APPROVED', () => {
    component.sale.set({ ...mockSale, returns: [{ id: '1', status: 'REQUESTED', total: 10, createdAt: new Date().toISOString() }] });
    expect(component.hasPendingReturns()).toBeTrue();

    component.sale.set({ ...mockSale, returns: [{ id: '2', status: 'APPROVED', total: 10, createdAt: new Date().toISOString() }] });
    expect(component.hasPendingReturns()).toBeTrue();
  });

  it('should return false for hasPendingReturns if returns are REFUNDED or REJECTED', () => {
    component.sale.set({ ...mockSale, returns: [{ id: '1', status: 'REFUNDED', total: 10, createdAt: new Date().toISOString() }] });
    expect(component.hasPendingReturns()).toBeFalse();

    component.sale.set({ ...mockSale, returns: [{ id: '2', status: 'REJECTED', total: 10, createdAt: new Date().toISOString() }] });
    expect(component.hasPendingReturns()).toBeFalse();
  });

  it('should navigate to initiate return', () => {
    component.initiateReturn();
    expect(mockModalRef.close).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/returns/new'], { queryParams: { saleId: 'sale-1' } });
  });

  it('should download receipt', () => {
    const mockUrl = 'blob:url';
    spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
    spyOn(window.URL, 'revokeObjectURL');
    const mockClick = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.returnValue({
      click: mockClick
    } as any);

    component.onPrint();

    expect(mockSalesService.getReceipt).toHaveBeenCalledWith('sale-1');
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });
});
