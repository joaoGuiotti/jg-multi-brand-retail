import {
  MovementCollectionPresenter,
  MovementPresenter,
} from '../movement.presenter';

const makeMovementOutput = (overrides: any = {}) => ({
  id: 'mov-1',
  tenantId: 'tenant-1',
  productId: 'p1',
  userId: 'user-1',
  type: 'ENTRY',
  quantity: 5,
  reference: null,
  createdAt: new Date(),
  ...overrides,
});

describe('MovementPresenter', () => {
  it('should construct from MovementOutput', () => {
    const presenter = new MovementPresenter(makeMovementOutput());
    expect(presenter.id).toBe('mov-1');
    expect(presenter.type).toBe('ENTRY');
    expect(presenter.quantity).toBe(5);
    expect(presenter.reference).toBeNull();
  });

  it('should include reference when provided', () => {
    const presenter = new MovementPresenter(
      makeMovementOutput({ reference: 'sale-123' }),
    );
    expect(presenter.reference).toBe('sale-123');
  });
});

describe('MovementCollectionPresenter', () => {
  it('should construct from paginated list', () => {
    const presenter = new MovementCollectionPresenter({
      data: [makeMovementOutput(), makeMovementOutput({ id: 'mov-2' })],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
    expect(presenter.data).toHaveLength(2);
    expect(presenter.meta.total).toBe(2);
  });
});
