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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('loyalty')
@ApiBearerAuth('JWT')
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
    summary: 'Configurar programa de fidelidade',
    description:
      'Cria ou atualiza as regras do programa de fidelidade do Tenant (pontuação, resgate e limites). Exclusivo para administradores.',
    operationId: 'loyalty_configure',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações de fidelidade salvas com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode configurar o programa',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Erro de validação dos parâmetros enviados',
    type: ValidationErrorResponseDto,
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
    summary: 'Consultar configuração do programa de fidelidade',
    description:
      'Retorna as regras ativas do programa de fidelidade do Tenant. Se nenhum programa estiver configurado, retorna os valores padrão com `active: false`.',
    operationId: 'loyalty_getConfig',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações ativas retornadas com sucesso',
    schema: {
      example: {
        id: 'uuid',
        tenantId: 'uuid',
        name: 'Programa Fidelidade',
        pointsPerReal: 1.0,
        redeemRatio: 0.01,
        minRedeemPoints: 100,
        maxDiscountPct: 50.0,
        active: true,
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
    description: 'Perfil sem permissão',
    type: ForbiddenResponseDto,
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
    summary: 'Resgatar pontos como desconto',
    description:
      'Debita pontos da conta de fidelidade do cliente e aplica o desconto equivalente na venda ativa no PDV. O desconto é calculado com base no `redeemRatio` configurado.',
    operationId: 'loyalty_redeem',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos resgatados e desconto aplicado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente ou venda não encontrados',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Pontos insuficientes ou abaixo do mínimo configurado',
    type: ValidationErrorResponseDto,
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
    summary: 'Consultar conta de fidelidade do cliente',
    description:
      'Retorna o saldo atual de pontos e o extrato completo de transações (créditos e débitos) da conta de fidelidade do cliente.',
    operationId: 'loyalty_getAccount',
  })
  @ApiParam({
    name: 'customerId',
    description: 'UUID do cliente',
    format: 'uuid',
    example: 'd3b07384-d113-4956-a5cc-e435987114e9',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta de fidelidade retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado ou sem conta de fidelidade',
    type: NotFoundResponseDto,
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
  @ApiOperation({
    summary: 'Ajuste administrativo de pontos',
    description:
      'Permite ao administrador creditar ou debitar pontos manualmente na conta do cliente para fins de correção ou bonificação. Toda operação é registrada no extrato com a justificativa informada.',
    operationId: 'loyalty_adjustPoints',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo ajustado administrativamente com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode ajustar pontos manualmente',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos (ex: pontos = 0, justificativa muito curta)',
    type: ValidationErrorResponseDto,
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
