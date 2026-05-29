import { CancelSaleUseCase } from '@application/use-cases/sales/cancel-sale.use-case';
import { CompleteSaleUseCase } from '@application/use-cases/sales/complete-sale.use-case';
import { CreateSaleUseCase } from '@application/use-cases/sales/create-sale.use-case';
import { GetDailyRevenueUseCase } from '@application/use-cases/sales/get-daily-revenue.use-case';
import { GetSaleUseCase } from '@application/use-cases/sales/get-sale.use-case';
import { ListSalesUseCase } from '@application/use-cases/sales/list-sales.use-case';
import { GenerateSaleReceiptUseCase } from '@application/use-cases/sales/generate-sale-receipt.use-case';
import { GenerateSalesHistoryReportUseCase } from '@application/use-cases/sales/generate-sales-history-report.use-case';
import { CreateSaleDto, QuerySaleDto } from '@infrastructure/dtos/sales';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  SaleCollectionPresenter,
  SalePresenter,
} from '../presenters/sale.presenter';
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('sales')
@ApiBearerAuth('JWT')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class SalesController {
  constructor(
    private createSaleUseCase: CreateSaleUseCase,
    private listSalesUseCase: ListSalesUseCase,
    private getSaleUseCase: GetSaleUseCase,
    private cancelSaleUseCase: CancelSaleUseCase,
    private completeSaleUseCase: CompleteSaleUseCase,
    private getDailyRevenueUseCase: GetDailyRevenueUseCase,
    private generateSaleReceiptUseCase: GenerateSaleReceiptUseCase,
    private generateSalesHistoryReportUseCase: GenerateSalesHistoryReportUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Iniciar nova venda',
    description:
      'Cria uma nova venda no PDV para o Tenant do usuário autenticado. A venda inicia no status `OPEN` e permanece aberta até ser finalizada ou cancelada.',
    operationId: 'sales_create',
  })
  @ApiResponse({
    status: 201,
    description: 'Venda criada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos (ex: produto sem estoque, SKU inexistente)',
    type: ValidationErrorResponseDto,
  })
  async create(@CurrentUser() user: any, @Body() createSaleDto: CreateSaleDto) {
    const output = await this.createSaleUseCase.execute({
      tenantId: user.tenantId,
      userId: user.id,
      ...createSaleDto,
    });
    return new SalePresenter(output);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vendas',
    description:
      'Retorna a lista paginada de vendas do Tenant com suporte a filtros por status, período e usuário.',
    operationId: 'sales_findAll',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vendas retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async findAll(@CurrentUser() user: any, @Query() query: QuerySaleDto) {
    const output = await this.listSalesUseCase.execute({
      tenantId: user.tenantId,
      filters: query,
    });
    return new SaleCollectionPresenter(output);
  }

  @Get('reports/daily-revenue')
  @ApiOperation({
    summary: 'Relatório de receita diária',
    description:
      'Retorna a receita acumulada por dia para os últimos N dias. Útil para gráficos de desempenho no dashboard.',
    operationId: 'sales_getDailyRevenue',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Número de dias para o relatório (padrão: 7)',
    example: 7,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Receita diária retornada com sucesso',
    schema: {
      example: [
        { date: '2026-05-28', revenue: 1540.5 },
        { date: '2026-05-27', revenue: 2310.0 },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async getDailyRevenue(
    @CurrentUser() user: any,
    @Query('days') days?: number,
  ) {
    const output = await this.getDailyRevenueUseCase.execute({
      tenantId: user.tenantId,
      days: days ? Number(days) : 7,
    });
    return output;
  }

  @Get('reports/history')
  @ApiProduces('application/pdf')
  @ApiOperation({
    summary: 'Relatório histórico de vendas (PDF)',
    description:
      'Gera e faz o download de um relatório PDF com o histórico de vendas filtrado por período e status.',
    operationId: 'sales_getHistoryReport',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Data de início (ISO 8601: YYYY-MM-DD)',
    example: '2026-05-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data de fim (ISO 8601: YYYY-MM-DD)',
    example: '2026-05-28',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por status da venda',
    enum: ['OPEN', 'COMPLETED', 'CANCELLED'],
  })
  @ApiResponse({
    status: 200,
    description: 'PDF do relatório gerado com sucesso',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async getSalesReport(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.generateSalesHistoryReportUseCase.execute({
      tenantId: user.tenantId,
      startDate,
      endDate,
      status,
    });
    const filename = `sales-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    res!.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar venda por ID',
    description:
      'Retorna os dados completos de uma venda, incluindo itens e status de pagamento.',
    operationId: 'sales_findOne',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da venda',
    format: 'uuid',
    example: 'e5f5f190-b184-48de-8ef7-111166669999',
  })
  @ApiResponse({
    status: 200,
    description: 'Venda encontrada com sucesso',
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
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.getSaleUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
    return new SalePresenter(output);
  }

  @Get(':id/receipt')
  @ApiProduces('application/pdf')
  @ApiOperation({
    summary: 'Baixar comprovante da venda (PDF)',
    description:
      'Gera e retorna o comprovante da venda em formato PDF para impressão no PDV.',
    operationId: 'sales_getReceipt',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da venda',
    format: 'uuid',
    example: 'e5f5f190-b184-48de-8ef7-111166669999',
  })
  @ApiResponse({
    status: 200,
    description: 'Comprovante PDF gerado com sucesso',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
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
  async getReceipt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.generateSaleReceiptUseCase.execute({
      tenantId: user.tenantId,
      id,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=receipt-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar venda',
    description:
      'Cancela uma venda no status `OPEN`. Vendas `COMPLETED` não podem ser canceladas (use devoluções). Exclusivo para ADMIN.',
    operationId: 'sales_cancel',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da venda a ser cancelada',
    format: 'uuid',
    example: 'e5f5f190-b184-48de-8ef7-111166669999',
  })
  @ApiResponse({
    status: 200,
    description: 'Venda cancelada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode cancelar vendas',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venda não encontrada',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Venda não pode ser cancelada no status atual',
    type: ValidationErrorResponseDto,
  })
  async cancel(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.cancelSaleUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
    return new SalePresenter(output);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar venda',
    description:
      'Marca a venda como `COMPLETED`. A venda deve estar no status `OPEN` e todos os pagamentos devem estar confirmados.',
    operationId: 'sales_complete',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da venda a ser finalizada',
    format: 'uuid',
    example: 'e5f5f190-b184-48de-8ef7-111166669999',
  })
  @ApiResponse({
    status: 200,
    description: 'Venda finalizada com sucesso',
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
  @ApiResponse({
    status: 422,
    description:
      'Venda não pode ser finalizada (pagamento pendente ou status inválido)',
    type: ValidationErrorResponseDto,
  })
  async complete(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.completeSaleUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
    return new SalePresenter(output);
  }
}
