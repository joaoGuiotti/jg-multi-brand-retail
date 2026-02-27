import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryMovementType, InventoryMovementTypes } from '../../../domain/entities/inventory/inventory-movement-type.vo';
import { InventoryMovement } from '../../../domain/entities/inventory/inventory-movement.entity';
import { Product } from '../../../domain/entities/products/product.entity';
import { CreateMovementUseCase } from './create-movement.use-case';

const makeProduct = (overrides: any = {}) =>
    Product.create({
        tenantId: 'tenant-1',
        name: 'Widget',
        sku: 'WG-001',
        costPrice: 10,
        salePrice: 20,
        margin: 100,
        stockQuantity: 20,
        unit: 'UN',
        active: true,
        ...overrides,
    });

const makeMovement = (overrides: any = {}) =>
    InventoryMovement.create({
        tenantId: 'tenant-1',
        productId: 'prod-1',
        userId: 'user-1',
        type: InventoryMovementType.create(InventoryMovementTypes.ENTRY),
        quantity: 5,
        ...overrides,
    });

describe('CreateMovementUseCase', () => {
    let useCase: CreateMovementUseCase;
    let inventoryRepository: any;
    let productRepository: any;

    beforeEach(() => {
        inventoryRepository = { create: jest.fn() };
        productRepository = { findById: jest.fn(), update: jest.fn() };
        useCase = new CreateMovementUseCase(inventoryRepository, productRepository);
    });

    const baseInput = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        productId: 'prod-1',
        type: InventoryMovementTypes.ENTRY,
        quantity: 5,
    };

    it('should throw NotFoundException if product is not found', async () => {
        productRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
    });

    it('should adjust stock up on ENTRY movement', async () => {
        const product = makeProduct({ stockQuantity: 10 });
        const movement = makeMovement();
        productRepository.findById.mockResolvedValue(product);
        inventoryRepository.create.mockResolvedValue(movement);

        await useCase.execute({ ...baseInput, type: InventoryMovementTypes.ENTRY, quantity: 5 });
        expect(product.stockQuantity).toBe(15);
    });

    it('should adjust stock up on RETURN movement', async () => {
        const product = makeProduct({ stockQuantity: 10 });
        const movement = makeMovement({ type: 'RETURN' });
        productRepository.findById.mockResolvedValue(product);
        inventoryRepository.create.mockResolvedValue(movement);

        await useCase.execute({ ...baseInput, type: InventoryMovementTypes.RETURN, quantity: 3 });
        expect(product.stockQuantity).toBe(13);
    });

    it('should adjust stock down on EXIT movement', async () => {
        const product = makeProduct({ stockQuantity: 20 });
        const movement = makeMovement({ type: 'EXIT' });
        productRepository.findById.mockResolvedValue(product);
        inventoryRepository.create.mockResolvedValue(movement);

        await useCase.execute({ ...baseInput, type: InventoryMovementTypes.EXIT, quantity: 5 });
        expect(product.stockQuantity).toBe(15);
    });

    it('should throw BadRequestException on EXIT when stock is insufficient', async () => {
        const product = makeProduct({ stockQuantity: 2 });
        productRepository.findById.mockResolvedValue(product);

        await expect(useCase.execute({ ...baseInput, type: InventoryMovementTypes.EXIT, quantity: 10 }))
            .rejects.toThrow(BadRequestException);
    });

    it('should set stock absolutely on ADJUSTMENT movement', async () => {
        const product = makeProduct({ stockQuantity: 10 });
        const movement = makeMovement({ type: 'ADJUSTMENT' });
        productRepository.findById.mockResolvedValue(product);
        inventoryRepository.create.mockResolvedValue(movement);

        await useCase.execute({ ...baseInput, type: InventoryMovementTypes.ADJUSTMENT, quantity: 50 });
        expect(product.stockQuantity).toBe(50);
    });

    it('should update the product and create a movement record', async () => {
        const product = makeProduct();
        const movement = makeMovement();
        productRepository.findById.mockResolvedValue(product);
        inventoryRepository.create.mockResolvedValue(movement);

        await useCase.execute(baseInput);
        expect(productRepository.update).toHaveBeenCalledWith(product);
        expect(inventoryRepository.create).toHaveBeenCalledTimes(1);
    });
});
