import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateReturnUseCase } from '../../application/use-cases/returns/create-return.use-case';
import { ListReturnsUseCase } from '../../application/use-cases/returns/list-returns.use-case';
import { GetReturnUseCase } from '../../application/use-cases/returns/get-return.use-case';
import { UpdateReturnStatusUseCase } from '../../application/use-cases/returns/update-return-status.use-case';
import { ProcessRefundUseCase } from '../../application/use-cases/returns/process-refund.use-case';
import { CreateReturnDto } from '../dtos/returns/create-return.dto';
import { ApproveReturnDto } from '../dtos/returns/approve-return.dto';
import {
  ReturnPresenter,
  ReturnCollectionPresenter,
} from '../presenters/return.presenter';
import { Role } from '@prisma/client';
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('returns')
@ApiBearerAuth('JWT')
@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(
    private readonly createReturnUseCase: CreateReturnUseCase,
    private readonly listReturnsUseCase: ListReturnsUseCase,
    private readonly getReturnUseCase: GetReturnUseCase,
    private readonly updateReturnStatusUseCase: UpdateReturnStatusUseCase,
    private readonly processRefundUseCase: ProcessRefundUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar devolução',
    description:
      'Abre uma solicitação de devolução para um ou mais itens de uma venda concluída. A devolução inicia no status `PENDING` aguardando aprovação do ADMIN.',
    operationId: 'returns_create',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitação de devolução criada com sucesso',
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
    description: 'Venda não elegível para devolução ou itens inválidos',
    type: ValidationErrorResponseDto,
  })
  async create(
    @CurrentUser() user: any,
    @Body() createReturnDto: CreateReturnDto,
  ) {
    const output = await this.createReturnUseCase.execute(
      user.tenantId,
      user.id,
      createReturnDto,
    );
    return new ReturnPresenter(output);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Listar devoluções',
    description:
      'Retorna a lista paginada de devoluções do Tenant com suporte a filtros por status, venda e cliente.',
    operationId: 'returns_findAll',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por status da devolução',
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'],
  })
  @ApiQuery({
    name: 'saleId',
    required: false,
    description: 'Filtrar devoluções de uma venda específica (UUID)',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Filtrar devoluções de um cliente específico (UUID)',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página (padrão: 10)',
    example: 10,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de devoluções retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas ADMIN e SUPER_ADMIN podem listar devoluções',
    type: ForbiddenResponseDto,
  })
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    const output = await this.listReturnsUseCase.execute(user.tenantId, {
      status: query.status,
      saleId: query.saleId,
      customerId: query.customerId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    });

    return new ReturnCollectionPresenter(output);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Buscar devolução por ID',
    description:
      'Retorna os detalhes completos de uma solicitação de devolução.',
    operationId: 'returns_findOne',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da devolução',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Devolução encontrada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Devolução não encontrada',
    type: NotFoundResponseDto,
  })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.getReturnUseCase.execute(user.tenantId, id);
    return new ReturnPresenter(output);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Atualizar status da devolução',
    description:
      'Aprova ou rejeita uma solicitação de devolução pendente. Após aprovação, o item retorna ao estoque. Para processar o reembolso financeiro, use `PATCH /returns/:id/refund`.',
    operationId: 'returns_updateStatus',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da devolução',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da devolução atualizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas ADMIN e SUPER_ADMIN podem atualizar o status',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Devolução não encontrada',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Transição de status inválida',
    type: ValidationErrorResponseDto,
  })
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() approveReturnDto: ApproveReturnDto,
  ) {
    const output = await this.updateReturnStatusUseCase.execute(
      user.tenantId,
      user.id,
      id,
      approveReturnDto,
    );
    return new ReturnPresenter(output);
  }

  @Patch(':id/refund')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Processar reembolso da devolução',
    description:
      'Executa o reembolso financeiro de uma devolução já aprovada. A devolução deve estar no status `APPROVED`. Após o reembolso, o status passa para `REFUNDED`.',
    operationId: 'returns_processRefund',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da devolução aprovada',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Reembolso processado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas ADMIN e SUPER_ADMIN podem processar reembolsos',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Devolução não encontrada',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Devolução não está no status APPROVED',
    type: ValidationErrorResponseDto,
  })
  async processRefund(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.processRefundUseCase.execute(user.tenantId, id);
    return new ReturnPresenter(output);
  }
}
