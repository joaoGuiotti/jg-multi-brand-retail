import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { FinanceController } from '../controllers/finance.controller';
import { CommissionsController } from '../controllers/commissions.controller';
import {
  CreateAccountUseCase,
  PayAccountUseCase,
  ListAccountsUseCase,
} from '../../application/use-cases/finance/account-management.use-cases';
import {
  GetCashFlowUseCase,
  CalculateDREUseCase,
} from '../../application/use-cases/finance/reports.use-cases';
import { GenerateDREPdfUseCase } from '../../application/use-cases/finance/pdf.use-cases';
import { PdfService } from '../services/pdf/pdf.service';

import { UpdateCommissionRateUseCase } from '../../application/use-cases/finance/update-commission-rate.use-case';
import { GetCommissionRateUseCase } from '../../application/use-cases/finance/get-commission-rate.use-case';
import { SetSalesTargetUseCase } from '../../application/use-cases/finance/set-sales-target.use-case';
import { GetSellerDashboardMetricsUseCase } from '../../application/use-cases/finance/get-seller-dashboard-metrics.use-case';
import { ListCommissionsUseCase } from '../../application/use-cases/finance/list-commissions.use-case';
import { CommissionEventsHandler } from '../../application/events/handlers/commission-events.handler';
import { TenantRepository } from '../../domain/repositories/tenant-repository';
import { PrismaTenantRepository } from '../persistence/repositories/prisma-tenant.repository';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController, CommissionsController],
  providers: [
    {
      provide: TenantRepository,
      useClass: PrismaTenantRepository,
    },
    CreateAccountUseCase,
    PayAccountUseCase,
    ListAccountsUseCase,
    GetCashFlowUseCase,
    CalculateDREUseCase,
    GenerateDREPdfUseCase,
    PdfService,
    UpdateCommissionRateUseCase,
    GetCommissionRateUseCase,
    SetSalesTargetUseCase,
    GetSellerDashboardMetricsUseCase,
    ListCommissionsUseCase,
    CommissionEventsHandler,
  ],
})
export class FinanceModule {}
