import { GetDashboardSnapshotUseCase } from '@application/use-cases/dashboard/get-dashboard-snapshot.use-case';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class DashboardController {
  constructor(
    private readonly getDashboardSnapshotUseCase: GetDashboardSnapshotUseCase,
  ) {}

  @Get('snapshot')
  async getSnapshot(@CurrentUser() user: any) {
    const output = await this.getDashboardSnapshotUseCase.execute({
      tenantId: user.tenantId,
    });
    // The existing TransformInterceptor will wrap this in {"data": result}
    return output;
  }
}
