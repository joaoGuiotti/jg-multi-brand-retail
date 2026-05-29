import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {
  CreateAccountUseCase,
  PayAccountUseCase,
  ListAccountsUseCase,
} from '../../application/use-cases/finance/account-management.use-cases';
import { CreateAccountDto, PayAccountDto } from '../dtos/finance/finance.dto';
import {
  GetCashFlowUseCase,
  CalculateDREUseCase,
} from '../../application/use-cases/finance/reports.use-cases';
import { GenerateDREPdfUseCase } from '../../application/use-cases/finance/pdf.use-cases';

@Controller('v1/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class FinanceController {
  constructor(
    private createAccountUseCase: CreateAccountUseCase,
    private payAccountUseCase: PayAccountUseCase,
    private listAccountsUseCase: ListAccountsUseCase,
    private getCashFlowUseCase: GetCashFlowUseCase,
    private calculateDREUseCase: CalculateDREUseCase,
    private generateDREPdfUseCase: GenerateDREPdfUseCase,
  ) {}

  @Get('accounts')
  async listAccounts(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.listAccountsUseCase.execute({
      tenantId: user.tenantId,
      type,
      status,
      startDate,
      endDate,
    });
  }

  @Post('accounts')
  async createAccount(@CurrentUser() user: any, @Body() dto: CreateAccountDto) {
    return this.createAccountUseCase.execute({
      tenantId: user.tenantId,
      ...dto,
    });
  }

  @Patch('accounts/:id/pay')
  async payAccount(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: PayAccountDto,
  ) {
    return this.payAccountUseCase.execute({
      tenantId: user.tenantId,
      id,
      paidAt: dto.paidAt,
    });
  }

  @Get('cash-flow')
  async getCashFlow(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.getCashFlowUseCase.execute({
      tenantId: user.tenantId,
      month: Number(month),
      year: Number(year),
    });
  }

  @Get('dre')
  async getDRE(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.calculateDREUseCase.execute({
      tenantId: user.tenantId,
      month: Number(month),
      year: Number(year),
    });
  }

  @Get('dre/pdf')
  async getDREPdf(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: any,
  ) {
    const buffer = await this.generateDREPdfUseCase.execute({
      tenantId: user.tenantId,
      month: Number(month),
      year: Number(year),
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=dre-${month}-${year}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
