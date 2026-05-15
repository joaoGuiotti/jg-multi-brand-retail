import {
  InventoryMovementType,
  InventoryMovementTypes,
} from '../../../../domain/entities/inventory/inventory-movement-type.vo';
import { InventoryMovement } from '../../../../domain/entities/inventory/inventory-movement.entity';
import { Payment } from '../../../../domain/entities/payments/payment.entity';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { InventoryMapper } from '../inventory.mapper';
import { PaymentMapper } from '../payment.mapper';
import { SaleMapper } from '../sale.mapper';

// ─────────────────────────────────────────────────────────────────────────────
// PaymentMapper tests
// ─────────────────────────────────────────────────────────────────────────────

const makeRawPayment = (overrides: any = {}): any => ({
  id: '550e8400-e29b-41d4-a716-446655440010',
  tenantId: 'tenant-1',
  saleId: 'sale-1',
  method: 'CASH',
  amount: { toNumber: () => 40 } as any,
  installments: 1,
  fee: { toNumber: () => 0 } as any,
  status: 'PAID',
  paidAt: null,
  metadata: null,
  createdAt: new Date(),
  ...overrides,
});

describe('PaymentMapper', () => {
  it('toDomain should create a Payment entity from raw Prisma data', () => {
    const raw = makeRawPayment();
    const payment = PaymentMapper.toDomain(raw);
    expect(payment).toBeInstanceOf(Payment);
    expect(payment.id.toString()).toBe(raw.id);
    expect(payment.method).toBe('CASH');
    expect(payment.amount).toBe(40);
  });

  it('toPersistence should convert a Payment entity to a plain object', () => {
    const payment = Payment.create({
      saleId: 'sale-1',
      method: 'CASH',
      amount: 40,
      status: 'PAID',
      installments: 1,
      fee: 0,
    });
    const raw = PaymentMapper.toPersistence(payment);
    expect(raw.id).toBe(payment.id.toString());
    expect(raw.method).toBe('CASH');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SaleMapper tests
// ─────────────────────────────────────────────────────────────────────────────

const makeRawSale = (overrides: any = {}): any => ({
  id: '550e8400-e29b-41d4-a716-446655440020',
  tenantId: 'tenant-1',
  userId: 'user-1',
  invoiceNumber: null,
  subtotal: { valueOf: () => 20 } as any,
  discount: { valueOf: () => 0 } as any,
  total: { valueOf: () => 20 } as any,
  status: 'PENDING',
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: null,
  ...overrides,
});

const makeRawSaleItem = (overrides: any = {}): any => ({
  id: '550e8400-e29b-41d4-a716-446655440030',
  saleId: '550e8400-e29b-41d4-a716-446655440020',
  productId: 'p1',
  quantity: 2,
  unitPrice: { valueOf: () => 10 } as any,
  discount: { valueOf: () => 0 } as any,
  total: { valueOf: () => 20 } as any,
  ...overrides,
});

describe('SaleMapper', () => {
  it('toDomain should create a Sale entity with no items', () => {
    const raw = makeRawSale();
    const sale = SaleMapper.toDomain(raw);
    expect(sale).toBeInstanceOf(Sale);
    expect(sale.id.toString()).toBe(raw.id);
    expect(sale.items).toHaveLength(0);
  });

  it('toDomain should create a Sale entity with items', () => {
    const raw = makeRawSale({ items: [makeRawSaleItem()] });
    const sale = SaleMapper.toDomain(raw);
    expect(sale.items).toHaveLength(1);
    expect(sale.items[0].productId).toBe('p1');
  });

  it('toDomain should map customer data to customerName', () => {
    const raw = makeRawSale({
      customerId: 'cust-1',
      customer: { firstName: 'John', lastName: 'Doe' },
    });
    const sale = SaleMapper.toDomain(raw);
    expect(sale.customerId).toBe('cust-1');
    expect(sale.customerName).toBe('John Doe');
  });

  it('toDomain should map RETURN_REQUESTED status correctly', () => {
    const raw = makeRawSale({ status: 'RETURN_REQUESTED' });
    const sale = SaleMapper.toDomain(raw);
    expect(sale.status).toBe('RETURN_REQUESTED');
  });

  it('toDomain should map payments and returns if present', () => {
    const raw = makeRawSale({
      payments: [{ id: 'pay-1', method: 'CASH', amount: 10 }],
      returnOrders: [{ id: 'ret-1', status: 'REQUESTED' }]
    });
    const sale = SaleMapper.toDomain(raw);
    expect(sale.payments).toHaveLength(1);
    expect(sale.payments[0].id).toBe('pay-1');
    expect(sale.returns).toHaveLength(1);
    expect(sale.returns[0].id).toBe('ret-1');
  });

  it('toDomain should map RETURNED status correctly', () => {
    const raw = makeRawSale({ status: 'RETURNED' });
    const sale = SaleMapper.toDomain(raw);
    expect(sale.status).toBe('RETURNED');
  });

  it('toPersistence should convert a Sale to a plain object', () => {
    const sale = Sale.create({
      userId: 'user-1',
      subtotal: 20,
      discount: 0,
      total: 20,
      status: 'PENDING',
      items: [],
      customerId: 'cust-1',
    });
    const raw = SaleMapper.toPersistence(sale);
    expect(raw.id).toBe(sale.id.toString());
    expect(raw.status).toBe('PENDING');
    expect(raw.customerId).toBe('cust-1');
  });

  it('toPersistence should preserve RETURN_REQUESTED status', () => {
    const sale = Sale.create({
      userId: 'u1',
      subtotal: 10,
      discount: 0,
      total: 10,
      status: 'RETURN_REQUESTED',
      items: [],
    });
    const raw = SaleMapper.toPersistence(sale);
    expect(raw.status).toBe('RETURN_REQUESTED');
  });

  it('toPersistence should preserve RETURNED status', () => {
    const sale = Sale.create({
      userId: 'u1',
      subtotal: 10,
      discount: 0,
      total: 10,
      status: 'RETURNED',
      items: [],
    });
    const raw = SaleMapper.toPersistence(sale);
    expect(raw.status).toBe('RETURNED');
  });

  it('toPersistenceItem should convert a SaleItem to a plain object', () => {
    const item = SaleItem.create({
      productId: 'p1',
      quantity: 2,
      unitPrice: 10,
      discount: 0,
      total: 20,
    });
    const raw = SaleMapper.toPersistenceItem(item, 'sale-1');
    expect(raw.saleId).toBe('sale-1');
    expect(raw.productId).toBe('p1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// InventoryMapper tests
// ─────────────────────────────────────────────────────────────────────────────

const makeRawMovement = (overrides: any = {}): any => ({
  id: '550e8400-e29b-41d4-a716-446655440040',
  tenantId: 'tenant-1',
  productId: 'p1',
  userId: 'u1',
  type: InventoryMovementTypes.ENTRY,
  quantity: 5,
  reference: null,
  createdAt: new Date(),
  ...overrides,
});

describe('InventoryMapper', () => {
  it('toDomain should create an InventoryMovement entity from raw data', () => {
    const raw = makeRawMovement();
    const movement = InventoryMapper.toDomain(raw);
    expect(movement).toBeInstanceOf(InventoryMovement);
    expect(movement.id.toString()).toBe(raw.id);
    expect(movement.type.value).toBe(InventoryMovementTypes.ENTRY);
  });

  it('toPersistence should convert an InventoryMovement to a plain object', () => {
    const movement = InventoryMovement.create({
      productId: 'p1',
      userId: 'u1',
      type: InventoryMovementType.create(InventoryMovementTypes.ENTRY),
      quantity: 5,
    });
    const raw = InventoryMapper.toPersistence(movement);
    expect(raw.id).toBe(movement.id.toString());
    expect(raw.type).toBe('ENTRY');
  });
});
