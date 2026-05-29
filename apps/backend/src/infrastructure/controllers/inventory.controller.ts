import { CreateMovementUseCase } from '@application/use-cases/inventory/create-movement.use-case';
import { GetProductMovementsUseCase } from '@application/use-cases/inventory/get-product-movements.use-case';
import { GetStockSummaryUseCase } from '@application/use-cases/inventory/get-stock-summary.use-case';
import { ListMovementsUseCase } from '@application/use-cases/inventory/list-movements.use-case';
import { GenerateInventoryReportUseCase } from '@application/use-cases/inventory/generate-inventory-report.use-case';
import {
  CreateInventoryMovementDto,
  QueryInventoryMovementDto,
} from '@infrastructure/dtos/inventory';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  MovementCollectionPresenter,
  MovementPresenter,
} from '../presenters/movement.presenter';
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';
import { Role } from '@prisma/client';

@ApiTags('inventory')
@ApiBearerAuth('JWT')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class InventoryController {
  @Inject(CreateMovementUseCase)
  private createMovementUseCase: CreateMovementUseCase;
  @Inject(ListMovementsUseCase)
  private listMovementsUseCase: ListMovementsUseCase;
  @Inject(GetStockSummaryUseCase)
  private getStockSummaryUseCase: GetStockSummaryUseCase;
  @Inject(GetProductMovementsUseCase)
  private getProductMovementsUseCase: GetProductMovementsUseCase;
  @Inject(GenerateInventoryReportUseCase)
  private generateInventoryReportUseCase: GenerateInventoryReportUseCase;

  @Post('movements')
  @ApiOperation({
    summary: 'Registrar movimentação de estoque',
    description:
      'Registra uma entrada ou saída manual de estoque (ajuste, perda, bonificação). As movimentações geradas automaticamente por vendas não passam por este endpoint.',
    operationId: 'inventory_createMovement',
  })
  @ApiResponse({
    status: 201,
    description: 'Movimentação registrada com sucesso',
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
    description: 'Produto não encontrado',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos ou quantidade insuficiente em estoque',
    type: ValidationErrorResponseDto,
  })
  async createMovement(
    @CurrentUser() user: any,
    @Body() dto: CreateInventoryMovementDto,
  ) {
    const output = await this.createMovementUseCase.execute({
      tenantId: user.tenantId,
      userId: user.id,
      ...dto,
    });
    return new MovementPresenter(output);
  }

  @Get('movements')
  @ApiOperation({
    summary: 'Listar movimentações de estoque',
    description:
      'Retorna a lista paginada de movimentações de estoque do Tenant com suporte a filtros.',
    operationId: 'inventory_findAllMovements',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimentações retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async findAllMovements(
    @CurrentUser() user: any,
    @Query() query: QueryInventoryMovementDto,
  ) {
    const output = await this.listMovementsUseCase.execute({
      tenantId: user.tenantId,
      filters: query,
    });
    return new MovementCollectionPresenter(output);
  }

  @Get('movements/:id')
  @ApiOperation({
    summary: 'Buscar movimentação por ID',
    description:
      'Retorna os detalhes de uma movimentação de estoque específica.',
    operationId: 'inventory_findOneMovement',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da movimentação',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Movimentação encontrada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Movimentação não encontrada',
    type: NotFoundResponseDto,
  })
  async findOneMovement(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.listMovementsUseCase.execute({
      tenantId: user.tenantId,
      filters: { sortBy: 'createdAt', sortOrder: 'desc' },
    });
    return new MovementCollectionPresenter(output);
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Histórico de movimentações por produto',
    description:
      'Retorna todas as movimentações de estoque de um produto específico.',
    operationId: 'inventory_findByProduct',
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID do produto',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Movimentações do produto retornadas com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado',
    type: NotFoundResponseDto,
  })
  async findByProduct(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.getProductMovementsUseCase.execute({
      tenantId: user.tenantId,
      productId,
    });
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resumo do estoque atual',
    description:
      'Retorna uma visão consolidada do estoque do Tenant: total de produtos, itens em falta, estoque baixo e valor total em estoque.',
    operationId: 'inventory_getStockSummary',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo do estoque retornado com sucesso',
    schema: {
      example: {
        totalProducts: 120,
        outOfStock: 5,
        lowStock: 12,
        totalStockValue: 48500.0,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async getStockSummary(@CurrentUser() user: any) {
    return this.getStockSummaryUseCase.execute({ tenantId: user.tenantId });
  }

  @Get('report')
  @ApiProduces('application/pdf')
  @ApiOperation({
    summary: 'Relatório de estoque (PDF)',
    description:
      'Gera e faz o download de um relatório PDF com o inventário filtrado por período, tipo de movimentação e produto.',
    operationId: 'inventory_getReport',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Data de início do período (ISO 8601: YYYY-MM-DD)',
    example: '2026-05-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data de fim do período (ISO 8601: YYYY-MM-DD)',
    example: '2026-05-28',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Tipo de movimentação para filtrar',
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'UUID do produto para filtrar',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF do relatório de estoque gerado com sucesso',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async getInventoryReport(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('productId') productId?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.generateInventoryReportUseCase.execute({
      tenantId: user.tenantId,
      startDate,
      endDate,
      type,
      productId,
    });
    const filename = `inventory-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    res!.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
  }
}
