import { PaginationOutputMapper } from '../../application/pagination-output';
import { UniqueEntityID } from '../unique-entity-id';
import { ValueObject } from '../value-object';

// --------- ValueObject tests ---------
class TestValueObject extends ValueObject {
    constructor(public readonly value: string) {
        super();
    }
}

class OtherValueObject extends ValueObject {
    constructor(public readonly value: string) {
        super();
    }
}

describe('ValueObject', () => {
    it('equals() should return true for two identical instances', () => {
        const v1 = new TestValueObject('hello');
        const v2 = new TestValueObject('hello');
        expect(v1.equals(v2)).toBe(true);
    });

    it('equals() should return false for two different instances', () => {
        const v1 = new TestValueObject('hello');
        const v2 = new TestValueObject('world');
        expect(v1.equals(v2)).toBe(false);
    });

    it('equals() should return false for null', () => {
        const v1 = new TestValueObject('hello');
        expect(v1.equals(null as any)).toBe(false);
    });

    it('equals() should return false for undefined', () => {
        const v1 = new TestValueObject('hello');
        expect(v1.equals(undefined as any)).toBe(false);
    });

    it('equals() should return false for different constructor types', () => {
        const v1 = new TestValueObject('hello');
        const v2 = new OtherValueObject('hello');
        expect(v1.equals(v2 as any)).toBe(false);
    });
});

// --------- UniqueEntityID cross-validation tests ---------
describe('UniqueEntityID cross-equality', () => {
    it('Two UniqueEntityIDs with the same UUID should be equal', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const id1 = new UniqueEntityID(uuid);
        const id2 = new UniqueEntityID(uuid);
        expect(id1.equals(id2)).toBe(true);
    });

    it('Two UniqueEntityIDs with different UUIDs should not be equal', () => {
        const id1 = new UniqueEntityID();
        const id2 = new UniqueEntityID();
        expect(id1.equals(id2)).toBe(false);
    });
});

// --------- PaginationOutputMapper tests ---------
describe('PaginationOutputMapper', () => {
    it('should return data array and meta', () => {
        const result = PaginationOutputMapper.toOutput(['a', 'b', 'c'], {
            meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
        });
        expect(result.data).toEqual(['a', 'b', 'c']);
        expect(result.meta.total).toBe(3);
        expect(result.meta.page).toBe(1);
    });

    it('should handle empty data', () => {
        const result = PaginationOutputMapper.toOutput([], {
            meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        });
        expect(result.data).toHaveLength(0);
        expect(result.meta.total).toBe(0);
    });
});
