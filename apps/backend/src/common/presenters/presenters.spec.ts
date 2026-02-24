import { CollectionPresenter } from './collection.presenter';
import { PaginationPresenter } from './pagination.presenter';

// --------- PaginationPresenter tests ---------
describe('PaginationPresenter', () => {
    it('should construct with all pagination properties', () => {
        const presenter = new PaginationPresenter({ page: 2, limit: 10, totalPages: 5, total: 50 });
        expect(presenter.page).toBe(2);
        expect(presenter.limit).toBe(10);
        expect(presenter.totalPages).toBe(5);
        expect(presenter.total).toBe(50);
    });

    it('should work with first page and no results', () => {
        const presenter = new PaginationPresenter({ page: 1, limit: 10, totalPages: 0, total: 0 });
        expect(presenter.total).toBe(0);
        expect(presenter.totalPages).toBe(0);
    });
});

// --------- CollectionPresenter tests ---------
class TestCollectionPresenter extends CollectionPresenter {
    data: string[];
    constructor(data: string[], meta: { page: number; limit: number; totalPages: number; total: number }) {
        super(meta);
        this.data = data;
    }
}

describe('CollectionPresenter', () => {
    it('should expose pagination via meta getter', () => {
        const presenter = new TestCollectionPresenter(['a', 'b'], { page: 1, limit: 10, totalPages: 1, total: 2 });
        expect(presenter.meta.total).toBe(2);
        expect(presenter.meta.page).toBe(1);
        expect(presenter.data).toEqual(['a', 'b']);
    });
});
