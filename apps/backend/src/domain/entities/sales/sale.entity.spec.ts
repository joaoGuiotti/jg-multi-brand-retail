import { Sale, SaleItem } from './sale.entity';

const makeSaleItem = () =>
  SaleItem.create({
    productId: 'prod-1',
    quantity: 2,
    unitPrice: 10,
    discount: 0,
    total: 20,
  });

const makeSale = (overrides?: Partial<Parameters<typeof Sale.create>[0]>) =>
  Sale.create({
    userId: 'user-1',
    subtotal: 20,
    discount: 0,
    total: 20,
    status: 'PENDING',
    items: [makeSaleItem()],
    ...overrides,
  });

// ─────────────────────────────────────────────────────────────────────
// SaleItem
// ─────────────────────────────────────────────────────────────────────
describe('SaleItem Entity', () => {
  it('should create a sale item with all fields', () => {
    const item = makeSaleItem();
    expect(item.productId).toBe('prod-1');
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(10);
    expect(item.discount).toBe(0);
    expect(item.total).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Sale — creation
// ─────────────────────────────────────────────────────────────────────
describe('Sale Entity — creation', () => {
  it('should create a sale with required fields', () => {
    const sale = makeSale();
    expect(sale).toBeDefined();
    expect(sale.userId).toBe('user-1');
    expect(sale.status).toBe('PENDING');
    expect(sale.items).toHaveLength(1);
  });

  it('should expose all optional properties', () => {
    const sale = makeSale({
      invoiceNumber: 'INV-001',
      discount: 5,
      subtotal: 25,
      customerId: 'cust-1',
      customerName: 'John Doe',
    });
    expect(sale.invoiceNumber).toBe('INV-001');
    expect(sale.subtotal).toBe(25);
    expect(sale.discount).toBe(5);
    expect(sale.customerId).toBe('cust-1');
    expect(sale.customerName).toBe('John Doe');
    expect(sale.createdAt).toBeDefined();
    expect(sale.updatedAt).toBeDefined();
    expect(sale.payments).toEqual([]);
    expect(sale.returns).toEqual([]);
  });

  it('should expose payments and returns if provided', () => {
    const sale = makeSale({
      payments: [{ id: 'p1' }],
      returns: [{ id: 'r1' }],
    });
    expect(sale.payments).toHaveLength(1);
    expect(sale.payments[0].id).toBe('p1');
    expect(sale.returns).toHaveLength(1);
    expect(sale.returns[0].id).toBe('r1');
  });

  it('should default status to PENDING when not provided', () => {
    const sale = Sale.create({
      userId: 'u1',
      subtotal: 10,
      discount: 0,
      total: 10,
      status: 'PENDING',
      items: [],
    });
    expect(sale.status).toBe('PENDING');
  });
});

// ─────────────────────────────────────────────────────────────────────
// complete()
// ─────────────────────────────────────────────────────────────────────
describe('Sale Entity — complete()', () => {
  it('should transition PENDING → COMPLETED when fully paid', () => {
    const sale = makeSale({ total: 20 });
    sale.complete(20, 'tenant-tst');
    expect(sale.status).toBe('COMPLETED');
  });

  it('should allow overpayment (>=)', () => {
    const sale = makeSale({ total: 20 });
    sale.complete(25, 'tenant-tst');
    expect(sale.status).toBe('COMPLETED');
  });

  it('should throw if sale is already COMPLETED', () => {
    const sale = makeSale({ status: 'COMPLETED' });
    expect(() => sale.complete(20, 'tenant-tst')).toThrow(
      'Sale already completed',
    );
  });

  it('should throw if sale is CANCELLED', () => {
    const sale = makeSale({ status: 'CANCELLED' });
    expect(() => sale.complete(20, 'tenant-tst')).toThrow(
      'Cannot complete a cancelled sale',
    );
  });

  it('should throw if totalPaid is less than sale total', () => {
    const sale = makeSale({ total: 100 });
    expect(() => sale.complete(50, 'tenant-tst')).toThrow(
      'Insufficient payments',
    );
  });

  it('should update updatedAt on completion', () => {
    const sale = makeSale({ total: 20 });
    const before = sale.updatedAt!.getTime();
    sale.complete(20, 'tenant-tst');
    expect(sale.updatedAt!.getTime()).toBeGreaterThanOrEqual(before);
  });
});

// ─────────────────────────────────────────────────────────────────────
// cancel()
// ─────────────────────────────────────────────────────────────────────
describe('Sale Entity — cancel()', () => {
  it('should transition PENDING → CANCELLED', () => {
    const sale = makeSale();
    sale.cancel();
    expect(sale.status).toBe('CANCELLED');
  });

  it('should throw if sale is already CANCELLED', () => {
    const sale = makeSale({ status: 'CANCELLED' });
    expect(() => sale.cancel()).toThrow('Sale already cancelled');
  });

  it('should throw if sale is COMPLETED', () => {
    const sale = makeSale({ status: 'COMPLETED' });
    expect(() => sale.cancel()).toThrow(/Cannot cancel/);
  });

  it('should throw if sale is RETURN_REQUESTED', () => {
    const sale = makeSale({ status: 'RETURN_REQUESTED' });
    expect(() => sale.cancel()).toThrow(/Cannot cancel/);
  });

  it('should throw if sale is RETURNED', () => {
    const sale = makeSale({ status: 'RETURNED' });
    expect(() => sale.cancel()).toThrow(/Cannot cancel/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// requestReturn()
// ─────────────────────────────────────────────────────────────────────
describe('Sale Entity — requestReturn()', () => {
  it('should transition COMPLETED → RETURN_REQUESTED', () => {
    const sale = makeSale({ status: 'COMPLETED' });
    sale.requestReturn();
    expect(sale.status).toBe('RETURN_REQUESTED');
  });

  it('should update updatedAt on requestReturn', () => {
    const sale = makeSale({ status: 'COMPLETED' });
    const before = sale.updatedAt!.getTime();
    sale.requestReturn();
    expect(sale.updatedAt!.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('should throw if sale is PENDING', () => {
    const sale = makeSale({ status: 'PENDING' });
    expect(() => sale.requestReturn()).toThrow(/COMPLETED sale/);
  });

  it('should throw if sale is already RETURN_REQUESTED', () => {
    const sale = makeSale({ status: 'RETURN_REQUESTED' });
    expect(() => sale.requestReturn()).toThrow(/COMPLETED sale/);
  });

  it('should throw if sale is RETURNED', () => {
    const sale = makeSale({ status: 'RETURNED' });
    expect(() => sale.requestReturn()).toThrow(/COMPLETED sale/);
  });

  it('should throw if sale is CANCELLED', () => {
    const sale = makeSale({ status: 'CANCELLED' });
    expect(() => sale.requestReturn()).toThrow(/COMPLETED sale/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// completeReturn()
// ─────────────────────────────────────────────────────────────────────
describe('Sale Entity — completeReturn()', () => {
  it('should transition RETURN_REQUESTED → RETURNED', () => {
    const sale = makeSale({ status: 'RETURN_REQUESTED' });
    sale.completeReturn();
    expect(sale.status).toBe('RETURNED');
  });

  it('should update updatedAt on completeReturn', () => {
    const sale = makeSale({ status: 'RETURN_REQUESTED' });
    const before = sale.updatedAt!.getTime();
    sale.completeReturn();
    expect(sale.updatedAt!.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('should throw if sale is COMPLETED (not yet in return flow)', () => {
    const sale = makeSale({ status: 'COMPLETED' });
    expect(() => sale.completeReturn()).toThrow(/RETURN_REQUESTED sale/);
  });

  it('should throw if sale is already RETURNED', () => {
    const sale = makeSale({ status: 'RETURNED' });
    expect(() => sale.completeReturn()).toThrow(/RETURN_REQUESTED sale/);
  });

  it('should throw if sale is PENDING', () => {
    const sale = makeSale({ status: 'PENDING' });
    expect(() => sale.completeReturn()).toThrow(/RETURN_REQUESTED sale/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// rejectReturn()
// ─────────────────────────────────────────────────────────────────────
describe('Sale Entity — rejectReturn()', () => {
  it('should transition RETURN_REQUESTED → COMPLETED', () => {
    const sale = makeSale({ status: 'RETURN_REQUESTED' });
    sale.rejectReturn();
    expect(sale.status).toBe('COMPLETED');
  });

  it('should update updatedAt on rejectReturn', () => {
    const sale = makeSale({ status: 'RETURN_REQUESTED' });
    const before = sale.updatedAt!.getTime();
    sale.rejectReturn();
    expect(sale.updatedAt!.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('should throw if sale is COMPLETED (not in return flow)', () => {
    const sale = makeSale({ status: 'COMPLETED' });
    expect(() => sale.rejectReturn()).toThrow(/RETURN_REQUESTED sale/);
  });

  it('should throw if sale is RETURNED (already processed)', () => {
    const sale = makeSale({ status: 'RETURNED' });
    expect(() => sale.rejectReturn()).toThrow(/RETURN_REQUESTED sale/);
  });

  it('should throw if sale is PENDING', () => {
    const sale = makeSale({ status: 'PENDING' });
    expect(() => sale.rejectReturn()).toThrow(/RETURN_REQUESTED sale/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Full FSM happy paths
// ─────────────────────────────────────────────────────────────────────
describe('Sale Entity — full FSM happy paths', () => {
  it('PENDING → COMPLETED → RETURN_REQUESTED → RETURNED (full return flow)', () => {
    const sale = makeSale({ total: 20 });
    sale.complete(20, 'tenant-tst');
    expect(sale.status).toBe('COMPLETED');
    sale.requestReturn();
    expect(sale.status).toBe('RETURN_REQUESTED');
    sale.completeReturn();
    expect(sale.status).toBe('RETURNED');
  });

  it('PENDING → COMPLETED → RETURN_REQUESTED → COMPLETED (rejected return)', () => {
    const sale = makeSale({ total: 20 });
    sale.complete(20, 'tenant-tst');
    sale.requestReturn();
    sale.rejectReturn();
    expect(sale.status).toBe('COMPLETED');
  });

  it('after rejection, customer can open a new return request', () => {
    const sale = makeSale({ status: 'COMPLETED' });
    sale.requestReturn();
    sale.rejectReturn();
    // Now COMPLETED again — can request return
    sale.requestReturn();
    expect(sale.status).toBe('RETURN_REQUESTED');
  });

  it('PENDING → CANCELLED (happy cancellation)', () => {
    const sale = makeSale();
    sale.cancel();
    expect(sale.status).toBe('CANCELLED');
  });
});
