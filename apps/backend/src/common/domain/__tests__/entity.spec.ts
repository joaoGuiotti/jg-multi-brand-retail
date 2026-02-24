import { Entity } from '../entity';
import { UniqueEntityID } from '../unique-entity-id';

// Concrete entity for testing
interface TestProps { value: string }
class TestEntity extends Entity<TestProps> {
    static create(props: TestProps, id?: UniqueEntityID): TestEntity {
        return new TestEntity(props, id);
    }
    get value() { return this.props.value; }
}

describe('Entity', () => {
    it('should generate an ID if not provided', () => {
        const e = TestEntity.create({ value: 'hello' });
        expect(e.id).toBeDefined();
        expect(e.id).toBeInstanceOf(UniqueEntityID);
    });

    it('should use the provided ID', () => {
        const id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
        const e = TestEntity.create({ value: 'hello' }, id);
        expect(e.id.toString()).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('equals() should return true for the same instance', () => {
        const e = TestEntity.create({ value: 'hello' });
        expect(e.equals(e)).toBe(true);
    });

    it('equals() should return true for two entities with the same ID', () => {
        const id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
        const e1 = TestEntity.create({ value: 'a' }, id);
        const e2 = TestEntity.create({ value: 'b' }, id);
        expect(e1.equals(e2)).toBe(true);
    });

    it('equals() should return false for two entities with different IDs', () => {
        const e1 = TestEntity.create({ value: 'a' });
        const e2 = TestEntity.create({ value: 'b' });
        expect(e1.equals(e2)).toBe(false);
    });

    it('equals() should return false when compared to null', () => {
        const e = TestEntity.create({ value: 'hello' });
        expect(e.equals(null as any)).toBe(false);
    });

    it('equals() should return false when compared to undefined', () => {
        const e = TestEntity.create({ value: 'hello' });
        expect(e.equals(undefined)).toBe(false);
    });

    it('equals() should return false when compared to a non-Entity', () => {
        const e = TestEntity.create({ value: 'hello' });
        expect(e.equals({ id: e.id } as any)).toBe(false);
    });
});
