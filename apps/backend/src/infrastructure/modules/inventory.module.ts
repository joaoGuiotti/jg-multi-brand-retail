import { Module } from '@nestjs/common';
import { CreateMovementUseCase } from '../../application/use-cases/inventory/create-movement.use-case';
import { GetProductMovementsUseCase } from '../../application/use-cases/inventory/get-product-movements.use-case';
import { GetStockSummaryUseCase } from '../../application/use-cases/inventory/get-stock-summary.use-case';
import { ListMovementsUseCase } from '../../application/use-cases/inventory/list-movements.use-case';
import { GenerateInventoryReportUseCase } from '../../application/use-cases/inventory/generate-inventory-report.use-case';
import { InventoryRepository } from '../../domain/repositories/inventory-repository';
import { TenantRepository } from '../../domain/repositories/tenant-repository';
import { InventoryController } from '../controllers/inventory.controller';
import { PrismaInventoryRepository } from '../persistence/repositories/prisma-inventory.repository';
import { PrismaTenantRepository } from '../persistence/repositories/prisma-tenant.repository';
import { PdfService } from '../services/pdf.service';
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
        {
            provide: TenantRepository,
            useClass: PrismaTenantRepository,
        },
        PdfService,
        CreateMovementUseCase,
        ListMovementsUseCase,
        GetStockSummaryUseCase,
        GetProductMovementsUseCase,
        GenerateInventoryReportUseCase,
    ],
    exports: [
        InventoryRepository,
        CreateMovementUseCase,
        ListMovementsUseCase,
        GetStockSummaryUseCase,
        GetProductMovementsUseCase,
        GenerateInventoryReportUseCase,
    ],
})
export class InventoryModule { }
