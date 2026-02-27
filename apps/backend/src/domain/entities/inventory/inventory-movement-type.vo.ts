import { ValueObject } from "../../../common/domain/value-object";

export enum InventoryMovementTypes {
    ENTRY = 'ENTRY',
    EXIT = 'EXIT',
    ADJUSTMENT = 'ADJUSTMENT',
    RETURN = 'RETURN'
}

export class InventoryMovementType extends ValueObject {
    private constructor(readonly type: InventoryMovementTypes) {
        super();
    }

    get value(): InventoryMovementTypes {
        return this.type;
    }

    public static create(type: InventoryMovementTypes): InventoryMovementType {
        InventoryMovementType.validate(type);
        return new InventoryMovementType(type);
    }

    public static createAnEntry(): InventoryMovementType {
        return new InventoryMovementType(InventoryMovementTypes.ENTRY);
    }

    public static createAnExit(): InventoryMovementType {
        return new InventoryMovementType(InventoryMovementTypes.EXIT);
    }

    public static createAnAdjustment(): InventoryMovementType {
        return new InventoryMovementType(InventoryMovementTypes.ADJUSTMENT);
    }

    public static createAReturn(): InventoryMovementType {
        return new InventoryMovementType(InventoryMovementTypes.RETURN);
    }

    private static validate(type: InventoryMovementTypes): void {

        if (!Object.values(InventoryMovementTypes).includes(type)) {
            throw new InventoryMovementTypeError(type);
        }
    }
}

export class InventoryMovementTypeError extends Error {
    constructor(type: InventoryMovementTypes) {
        super(`Invalid inventory movement type: ${type}`);
        this.name = 'InventoryMovementTypeError';
    }
}