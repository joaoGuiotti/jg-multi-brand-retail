import { CancelPaymentUseCase } from '@application/use-cases/payments/cancel-payment.use-case';
import { CreatePaymentUseCase } from '@application/use-cases/payments/create-payment.use-case';
import { GetPaymentUseCase } from '@application/use-cases/payments/get-payment.use-case';
import { GetSalePaymentsUseCase } from '@application/use-cases/payments/get-sale-payments.use-case';
import { ListPaymentsUseCase } from '@application/use-cases/payments/list-payments.use-case';
import {
  CreatePaymentDto,
  QueryPaymentDto,
} from '@infrastructure/dtos/payments';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  PaymentCollectionPresenter,
  PaymentPresenter,
} from '../presenters/payment.presenter';
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('payments')
@ApiBearerAuth('JWT')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  @Inject(CreatePaymentUseCase)
  private readonly createPaymentUseCase: CreatePaymentUseCase;
  @Inject(CancelPaymentUseCase)
  private readonly cancelPaymentUseCase: CancelPaymentUseCase;
  @Inject(ListPaymentsUseCase)
  private readonly listPaymentsUseCase: ListPaymentsUseCase;
  @Inject(GetPaymentUseCase)
  private readonly getPaymentUseCase: GetPaymentUseCase;
  @Inject(GetSalePaymentsUseCase)
  private readonly getSalePaymentsUseCase: GetSalePaymentsUseCase;

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Registrar pagamento',
    description:
      'Registra um pagamento para uma venda. Múltiplos pagamentos podem ser associados à mesma venda (ex: cartão + dinheiro). O método de pagamento é definido pelo campo `method`.',
    operationId: 'payments_create',
  })
  @ApiResponse({
    status: 201,
    description: 'Pagamento registrado com sucesso',
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
    description: 'Venda não encontrada',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos ou venda já finalizada',
    type: ValidationErrorResponseDto,
  })
  async create(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
    const output = await this.createPaymentUseCase.execute({
      tenantId: user.tenantId,
      ...dto,
    });
    return new PaymentPresenter(output);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar pagamentos',
    description:
      'Retorna a lista paginada de pagamentos do Tenant com suporte a filtros por método, status e período.',
    operationId: 'payments_findAll',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagamentos retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async findAll(@CurrentUser() user: any, @Query() query: QueryPaymentDto) {
    const output = await this.listPaymentsUseCase.execute({
      tenantId: user.tenantId,
      filters: query,
    });
    return new PaymentCollectionPresenter(output);
  }

  @Get('sale/:saleId')
  @ApiOperation({
    summary: 'Buscar pagamentos de uma venda',
    description:
      'Retorna todos os pagamentos vinculados a uma venda específica.',
    operationId: 'payments_findBySale',
  })
  @ApiParam({
    name: 'saleId',
    description: 'UUID da venda',
    format: 'uuid',
    example: 'e5f5f190-b184-48de-8ef7-111166669999',
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamentos da venda retornados com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venda não encontrada',
    type: NotFoundResponseDto,
  })
  async findBySale(@CurrentUser() user: any, @Param('saleId') saleId: string) {
    const output = await this.getSalePaymentsUseCase.execute({
      tenantId: user.tenantId,
      saleId,
    });
    return output.map((p) => new PaymentPresenter(p));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar pagamento por ID',
    description: 'Retorna os detalhes de um pagamento específico.',
    operationId: 'payments_findOne',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do pagamento',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamento encontrado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pagamento não encontrado',
    type: NotFoundResponseDto,
  })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.getPaymentUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
    return new PaymentPresenter(output);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar pagamento',
    description:
      'Cancela um pagamento pendente. Pagamentos confirmados não podem ser cancelados diretamente — use o fluxo de devolução.',
    operationId: 'payments_cancel',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do pagamento a ser cancelado',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamento cancelado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode cancelar pagamentos',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pagamento não encontrado',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Pagamento não pode ser cancelado no status atual',
    type: ValidationErrorResponseDto,
  })
  async cancel(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.cancelPaymentUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
    return new PaymentPresenter(output);
  }
}
