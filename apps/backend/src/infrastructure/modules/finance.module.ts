import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { FinanceController } from '../controllers/finance.controller';
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

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [
    CreateAccountUseCase,
    PayAccountUseCase,
    ListAccountsUseCase,
    GetCashFlowUseCase,
    CalculateDREUseCase,
    GenerateDREPdfUseCase,
    PdfService,
  ],
})
export class FinanceModule {}
