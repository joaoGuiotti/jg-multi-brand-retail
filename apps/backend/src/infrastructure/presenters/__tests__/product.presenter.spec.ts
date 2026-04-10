import {
  ProductCollectionPresenter,
  ProductPresenter,
} from '../product.presenter';

const makeProductOutput = (overrides: any = {}) => ({
  id: 'prod-1',
  tenantId: 'tenant-1',
  name: 'Widget',
  description: null,
  sku: 'WG-001',
  barcode: null,
  categoryId: null,
  brandId: null,
  supplierId: null,
  costPrice: 10,
  salePrice: 20,
  margin: 100,
  stockQuantity: 5,
  unit: 'UN',
  active: true,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ProductPresenter', () => {
  it('should construct from ProductOutput', () => {
    const presenter = new ProductPresenter(makeProductOutput());
    expect(presenter.id).toBe('prod-1');
    expect(presenter.sku).toBe('WG-001');
    expect(presenter.description).toBeNull();
  });

  it('should carry optional fields', () => {
    const presenter = new ProductPresenter(
      makeProductOutput({
        description: 'A widget',
        barcode: 'BAR1',
        categoryId: 'cat-1',
      }),
    );
    expect(presenter.description).toBe('A widget');
    expect(presenter.barcode).toBe('BAR1');
    expect(presenter.categoryId).toBe('cat-1');
  });
});

describe('ProductCollectionPresenter', () => {
  it('should construct from paginated list', () => {
    const presenter = new ProductCollectionPresenter({
      data: [
        makeProductOutput(),
        makeProductOutput({ id: 'prod-2', sku: 'WG-002' }),
      ],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
    expect(presenter.data).toHaveLength(2);
    expect(presenter.meta.total).toBe(2);
  });
});
