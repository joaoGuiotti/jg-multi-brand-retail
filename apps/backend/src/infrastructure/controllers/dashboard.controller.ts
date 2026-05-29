import { GetDashboardSnapshotUseCase } from '@application/use-cases/dashboard/get-dashboard-snapshot.use-case';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class DashboardController {
  constructor(
    private readonly getDashboardSnapshotUseCase: GetDashboardSnapshotUseCase,
  ) {}

  @Get('snapshot')
  @ApiOperation({
    summary: 'Obter snapshot do dashboard',
    description:
      'Retorna uma visão consolidada em tempo real do Tenant: total de vendas do dia, receita, produtos com estoque baixo, últimas transações e indicadores de desempenho.',
    operationId: 'dashboard_getSnapshot',
  })
  @ApiResponse({
    status: 200,
    description: 'Snapshot do dashboard retornado com sucesso',
    schema: {
      example: {
        salesToday: 42,
        revenueToday: 3850.75,
        lowStockProducts: 5,
        pendingReturns: 2,
        recentSales: [],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão para acessar o dashboard',
    type: ForbiddenResponseDto,
  })
  async getSnapshot(@CurrentUser() user: any) {
    const output = await this.getDashboardSnapshotUseCase.execute({
      tenantId: user.tenantId,
    });
    // The existing TransformInterceptor will wrap this in {"data": result}
    return output;
  }
}
