import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { InventoryMovementType, InventoryMovementTypes } from './inventory-movement-type.vo';
import { InventoryMovement, InventoryMovementProps } from './inventory-movement.entity';

const makeMovement = (overrides?: Partial<Omit<InventoryMovementProps, 'type'> & { type?: string | InventoryMovementType }>) => {
    const type = overrides?.type
        ? (typeof overrides.type === 'string' ? InventoryMovementType.create(overrides.type as InventoryMovementTypes) : overrides.type)
        : InventoryMovementType.create(InventoryMovementTypes.ENTRY);

    const { type: _, ...rest } = overrides || {};

    const props: InventoryMovementProps = {
        productId: 'prod-1',
        userId: 'user-1',
        type,
        quantity: 10,
        ...rest,
    };

    return InventoryMovement.create(props);
};

describe('InventoryMovement Entity', () => {
    it('should create a movement with required fields', () => {
        const m = makeMovement();
        expect(m).toBeDefined();
        expect(m.productId).toBe('prod-1');
        expect(m.userId).toBe('user-1');
        expect(m.type.value).toBe('ENTRY');
        expect(m.quantity).toBe(10);
    });

    it('should set createdAt by default', () => {
        const m = makeMovement();
        expect(m.createdAt).toBeDefined();
    });

    it('should expose reference if provided', () => {
        const m = makeMovement({ reference: 'PO-123' });
        expect(m.reference).toBe('PO-123');
    });

    it('should create movement with EXIT type', () => {
        const m = makeMovement({ type: 'EXIT', quantity: 5 });
        expect(m.type.value).toBe('EXIT');
        expect(m.quantity).toBe(5);
    });

    it('should create movement with ADJUSTMENT type', () => {
        const m = makeMovement({ type: 'ADJUSTMENT', quantity: 50 });
        expect(m.type.value).toBe('ADJUSTMENT');
    });

    it('should create movement with RETURN type', () => {
        const m = makeMovement({ type: 'RETURN' });
        expect(m.type.value).toBe('RETURN');
    });

    it('should accept a custom id', () => {
        const id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
        const m = InventoryMovement.create({
            productId: 'p',
            userId: 'u',
            type: InventoryMovementType.create(InventoryMovementTypes.ENTRY),
            quantity: 1
        }, id);
        expect(m.id.toString()).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
});
