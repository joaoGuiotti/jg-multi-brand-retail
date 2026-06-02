import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { UpdateCommissionRateUseCase } from '../../application/use-cases/finance/update-commission-rate.use-case';
import { GetCommissionRateUseCase } from '../../application/use-cases/finance/get-commission-rate.use-case';
import { SetSalesTargetUseCase } from '../../application/use-cases/finance/set-sales-target.use-case';
import { GetSellerDashboardMetricsUseCase } from '../../application/use-cases/finance/get-seller-dashboard-metrics.use-case';
import { ListCommissionsUseCase } from '../../application/use-cases/finance/list-commissions.use-case';

@Controller('v1/commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(
    private updateCommissionRateUseCase: UpdateCommissionRateUseCase,
    private getCommissionRateUseCase: GetCommissionRateUseCase,
    private setSalesTargetUseCase: SetSalesTargetUseCase,
    private getSellerDashboardMetricsUseCase: GetSellerDashboardMetricsUseCase,
    private listCommissionsUseCase: ListCommissionsUseCase,
  ) {}

  @Get('rate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getCommissionRate(@CurrentUser() user: any) {
    return this.getCommissionRateUseCase.execute({ tenantId: user.tenantId });
  }

  @Patch('rate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateCommissionRate(
    @CurrentUser() user: any,
    @Body() dto: { commissionRate: number },
  ) {
    return this.updateCommissionRateUseCase.execute({
      tenantId: user.tenantId,
      commissionRate: dto.commissionRate,
    });
  }

  @Post('targets')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async setSalesTarget(
    @CurrentUser() user: any,
    @Body() dto: { userId: string; month: number; year: number; targetAmount: number },
  ) {
    return this.setSalesTargetUseCase.execute({
      tenantId: user.tenantId,
      userId: dto.userId,
      month: dto.month,
      year: dto.year,
      targetAmount: dto.targetAmount,
    });
  }

  @Get('dashboard/metrics')
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  async getDashboardMetrics(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('userId') userIdParam?: string,
  ) {
    // Users can only view their own metrics unless they are admins.
    const targetUserId =
      user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN
        ? userIdParam || user.id
        : user.id;

    return this.getSellerDashboardMetricsUseCase.execute({
      tenantId: user.tenantId,
      userId: targetUserId,
      month: Number(month),
      year: Number(year),
    });
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async listCommissions(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listCommissionsUseCase.execute({
      tenantId: user.tenantId,
      userId,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }
}
