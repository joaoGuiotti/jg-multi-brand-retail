import { Module } from '@nestjs/common';
import { CancelSaleUseCase } from '../../application/use-cases/sales/cancel-sale.use-case';
import { CompleteSaleUseCase } from '../../application/use-cases/sales/complete-sale.use-case';
import { CreateSaleUseCase } from '../../application/use-cases/sales/create-sale.use-case';
import { GenerateSaleReceiptUseCase } from '../../application/use-cases/sales/generate-sale-receipt.use-case';
import { GenerateSalesHistoryReportUseCase } from '../../application/use-cases/sales/generate-sales-history-report.use-case';
import { GetDailyRevenueUseCase } from '../../application/use-cases/sales/get-daily-revenue.use-case';
import { GetSaleUseCase } from '../../application/use-cases/sales/get-sale.use-case';
import { ListSalesUseCase } from '../../application/use-cases/sales/list-sales.use-case';
import { SaleRepository } from '../../domain/repositories/sale-repository';
import { TenantRepository } from '../../domain/repositories/tenant-repository';
import { SalesController } from '../controllers/sales.controller';
import { PrismaSaleRepository } from '../persistence/repositories/prisma-sale.repository';
import { PrismaTenantRepository } from '../persistence/repositories/prisma-tenant.repository';
import { PdfService } from '../services/pdf';
import { PrismaModule } from './prisma.module';
import { ProductsModule } from './products.module';

@Module({
    imports: [PrismaModule, ProductsModule],
    controllers: [SalesController],
    providers: [
        {
            provide: SaleRepository,
            useClass: PrismaSaleRepository,
        },
        {
            provide: TenantRepository,
            useClass: PrismaTenantRepository,
        },
        PdfService,
        CreateSaleUseCase,
        ListSalesUseCase,
        GetSaleUseCase,
        CancelSaleUseCase,
        CompleteSaleUseCase,
        GetDailyRevenueUseCase,
        GenerateSaleReceiptUseCase,
        GenerateSalesHistoryReportUseCase,
    ],
    exports: [
        SaleRepository,
        CreateSaleUseCase,
        ListSalesUseCase,
        GetSaleUseCase,
        CancelSaleUseCase,
        CompleteSaleUseCase,
        GenerateSaleReceiptUseCase,
        GenerateSalesHistoryReportUseCase,
    ],
})
export class SalesModule { }
