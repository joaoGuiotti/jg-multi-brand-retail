import {
  Body,
  Controller,
  Put,
  Get,
  Post,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ConfigureLoyaltyProgramUseCase } from '../../application/use-cases/loyalty/configure-loyalty-program.use-case';
import { ConfigureLoyaltyProgramDto } from '../dtos/loyalty/configure-loyalty-program.dto';
import { RedeemPointsUseCase } from '../../application/use-cases/loyalty/redeem-points.use-case';
import { RedeemPointsDto } from '../dtos/loyalty/redeem-points.dto';
import { GetLoyaltyAccountUseCase } from '../../application/use-cases/loyalty/get-loyalty-account.use-case';
import { AdjustPointsManualUseCase } from '../../application/use-cases/loyalty/adjust-points-manual.use-case';
import { AdjustPointsManualDto } from '../dtos/loyalty/adjust-points-manual.dto';
import { LoyaltyRepository } from '../../domain/repositories/loyalty/loyalty.repository.interface';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
  constructor(
    private readonly configureLoyaltyProgramUseCase: ConfigureLoyaltyProgramUseCase,
    private readonly redeemPointsUseCase: RedeemPointsUseCase,
    private readonly getLoyaltyAccountUseCase: GetLoyaltyAccountUseCase,
    private readonly adjustPointsManualUseCase: AdjustPointsManualUseCase,
    private readonly loyaltyRepository: LoyaltyRepository,
  ) {}

  @Put('config')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Configura ou atualiza as regras de fidelidade do Tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações de fidelidade salvas com sucesso',
  })
  async configure(
    @CurrentUser() user: any,
    @Body() dto: ConfigureLoyaltyProgramDto,
  ) {
    return await this.configureLoyaltyProgramUseCase.execute(
      user.tenantId,
      dto,
    );
  }

  @Get('config')
  @Roles(Role.ADMIN, Role.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recupera as regras de fidelidade ativas do Tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações ativas retornadas com sucesso',
  })
  async getConfig(@CurrentUser() user: any) {
    const program = await this.loyaltyRepository.findProgramByTenantId(
      user.tenantId,
    );
    if (!program) {
      return {
        pointsPerReal: 1.0,
        redeemRatio: 0.01,
        minRedeemPoints: 100,
        maxDiscountPct: 50.0,
        active: false,
      };
    }
    return {
      id: program.id.toString(),
      tenantId: program.tenantId,
      name: program.name,
      pointsPerReal: program.pointsPerReal,
      redeemRatio: program.redeemRatio,
      minRedeemPoints: program.minRedeemPoints,
      maxDiscountPct: program.maxDiscountPct,
      active: program.active,
    };
  }

  @Post('redeem')
  @Roles(Role.ADMIN, Role.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resgata pontos de fidelidade como desconto na venda ativa',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos resgatados e desconto aplicado com sucesso',
  })
  async redeem(@CurrentUser() user: any, @Body() dto: RedeemPointsDto) {
    return await this.redeemPointsUseCase.execute({
      tenantId: user.tenantId,
      customerId: dto.customerId,
      pointsToRedeem: dto.pointsToRedeem,
      saleId: dto.saleId,
    });
  }

  @Get('account/:customerId')
  @Roles(Role.ADMIN, Role.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recupera o saldo e o extrato da conta de fidelidade do cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta de fidelidade retornada com sucesso',
  })
  async getAccount(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
  ) {
    return await this.getLoyaltyAccountUseCase.execute({
      tenantId: user.tenantId,
      customerId,
    });
  }

  @Post('adjust')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajusta manualmente o saldo de pontos do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Saldo ajustado administrativamente com sucesso',
  })
  async adjust(@CurrentUser() user: any, @Body() dto: AdjustPointsManualDto) {
    return await this.adjustPointsManualUseCase.execute({
      tenantId: user.tenantId,
      userId: user.id,
      customerId: dto.customerId,
      points: dto.points,
      reason: dto.reason,
    });
  }
}
