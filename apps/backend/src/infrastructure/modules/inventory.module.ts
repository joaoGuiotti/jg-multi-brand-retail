import { Module } from '@nestjs/common';
import { CreateMovementUseCase } from '../../application/use-cases/inventory/create-movement.use-case';
import { GetProductMovementsUseCase } from '../../application/use-cases/inventory/get-product-movements.use-case';
import { GetStockSummaryUseCase } from '../../application/use-cases/inventory/get-stock-summary.use-case';
import { ListMovementsUseCase } from '../../application/use-cases/inventory/list-movements.use-case';
import { InventoryRepository } from '../../domain/repositories/inventory-repository';
import { InventoryController } from '../controllers/inventory.controller';
import { PrismaInventoryRepository } from '../persistence/repositories/prisma-inventory.repository';
import { PrismaModule } from './prisma.module';
import { ProductsModule } from './products.module';

@Module({
    imports: [PrismaModule, ProductsModule],
    controllers: [InventoryController],
    providers: [
        {
            provide: InventoryRepository,
            useClass: PrismaInventoryRepository,
        },
        CreateMovementUseCase,
        ListMovementsUseCase,
        GetStockSummaryUseCase,
        GetProductMovementsUseCase,
    ],
    exports: [
        InventoryRepository,
        CreateMovementUseCase,
        ListMovementsUseCase,
        GetStockSummaryUseCase,
        GetProductMovementsUseCase,
    ],
})
export class InventoryModule { }
