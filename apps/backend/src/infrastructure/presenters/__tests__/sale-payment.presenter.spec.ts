import {
  PaymentCollectionPresenter,
  PaymentPresenter,
} from '../payment.presenter';
import {
  SaleCollectionPresenter,
  SaleItemPresenter,
  SalePresenter,
} from '../sale.presenter';

// --------- Sale Presenters ---------
const makeSaleItemOutput = (overrides: any = {}) => ({
  id: 'item-1',
  productId: 'p1',
  quantity: 2,
  unitPrice: 10,
  discount: 0,
  total: 20,
  ...overrides,
});

const makeSaleOutput = (overrides: any = {}) => ({
  id: 'sale-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  invoiceNumber: null,
  subtotal: 20,
  discount: 0,
  total: 20,
  status: 'PENDING',
  items: [makeSaleItemOutput()],
  customerId: null,
  customerName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('SaleItemPresenter', () => {
  it('should construct from SaleItemOutput', () => {
    const presenter = new SaleItemPresenter(makeSaleItemOutput());
    expect(presenter.productId).toBe('p1');
    expect(presenter.quantity).toBe(2);
    expect(presenter.total).toBe(20);
  });
});

describe('SalePresenter', () => {
  it('should construct from SaleOutput with items', () => {
    const presenter = new SalePresenter(
      makeSaleOutput({ customerName: 'John Doe' }),
    );
    expect(presenter.id).toBe('sale-1');
    expect(presenter.status).toBe('PENDING');
    expect(presenter.items).toHaveLength(1);
    expect(presenter.invoiceNumber).toBeNull();
    expect(presenter.customerName).toBe('John Doe');
  });
});

describe('SaleCollectionPresenter', () => {
  it('should construct from paginated list', () => {
    const presenter = new SaleCollectionPresenter({
      data: [makeSaleOutput(), makeSaleOutput({ id: 'sale-2' })],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
    expect(presenter.data).toHaveLength(2);
    expect(presenter.meta.total).toBe(2);
  });
});

// --------- Payment Presenters ---------
const makePaymentOutput = (overrides: any = {}) => ({
  id: 'pay-1',
  tenantId: 'tenant-1',
  saleId: 'sale-1',
  method: 'CASH',
  amount: 40,
  installments: 1,
  fee: 0,
  status: 'PAID',
  paidAt: null,
  metadata: null,
  createdAt: new Date(),
  ...overrides,
});

describe('PaymentPresenter', () => {
  it('should construct from PaymentOutput', () => {
    const presenter = new PaymentPresenter(makePaymentOutput());
    expect(presenter.id).toBe('pay-1');
    expect(presenter.method).toBe('CASH');
    expect(presenter.amount).toBe(40);
    expect(presenter.paidAt).toBeNull();
  });
});

describe('PaymentCollectionPresenter', () => {
  it('should construct from paginated list', () => {
    const presenter = new PaymentCollectionPresenter({
      data: [makePaymentOutput(), makePaymentOutput({ id: 'pay-2' })],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
    expect(presenter.data).toHaveLength(2);
    expect(presenter.meta.total).toBe(2);
  });
});
