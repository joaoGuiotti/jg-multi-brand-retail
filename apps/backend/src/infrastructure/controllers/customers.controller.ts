import { CustomerOutput } from '@application/use-cases/customers/common/customer-output';
import { CreateCustomerUseCase } from '@application/use-cases/customers/create-customer.use-case';
import { DeleteCustomerUseCase } from '@application/use-cases/customers/delete-customer.use-case';
import { GetCustomerUseCase } from '@application/use-cases/customers/get-customer.use-case';
import {
  ListCustomersOutput,
  ListCustomersUseCase,
} from '@application/use-cases/customers/list-customers.use-case';
import { UpdateCustomerUseCase } from '@application/use-cases/customers/update-customer.use-case';
import { CreateCustomerDto } from '@infrastructure/dtos/customers/create-customer.dto';
import { QueryCustomerDto } from '@infrastructure/dtos/customers/query-customer.dto';
import { UpdateCustomerDto } from '@infrastructure/dtos/customers/update-customer.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '@prisma/client';
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('customers')
@ApiBearerAuth('JWT')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class CustomersController {
  constructor(
    private createCustomerUseCase: CreateCustomerUseCase,
    private listCustomersUseCase: ListCustomersUseCase,
    private getCustomerUseCase: GetCustomerUseCase,
    private updateCustomerUseCase: UpdateCustomerUseCase,
    private deleteCustomerUseCase: DeleteCustomerUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastrar novo cliente',
    description:
      'Cria um novo cliente vinculado ao Tenant do usuário autenticado. O CPF/CNPJ deve ser único dentro do Tenant.',
    operationId: 'customers_create',
  })
  @ApiResponse({
    status: 201,
    description: 'Cliente criado com sucesso',
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
    status: 422,
    description: 'Dados inválidos ou CPF/CNPJ já cadastrado',
    type: ValidationErrorResponseDto,
  })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerOutput> {
    return this.createCustomerUseCase.execute({
      ...dto,
      tenantId: user.tenantId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar clientes',
    description:
      'Retorna a lista paginada de clientes do Tenant com suporte a filtros por nome, CPF/CNPJ e status.',
    operationId: 'customers_findAll',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async findAll(
    @CurrentUser() user: any,
    @Query() query: QueryCustomerDto,
  ): Promise<ListCustomersOutput> {
    return this.listCustomersUseCase.execute({
      tenantId: user.tenantId,
      filters: query,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar cliente por ID',
    description:
      'Retorna os dados completos de um cliente específico do Tenant.',
    operationId: 'customers_findOne',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do cliente',
    format: 'uuid',
    example: 'd3b07384-d113-4956-a5cc-e435987114e9',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
    type: NotFoundResponseDto,
  })
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<CustomerOutput> {
    return this.getCustomerUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dados do cliente',
    description:
      'Atualiza parcialmente os dados do cliente. Apenas os campos enviados no body serão alterados.',
    operationId: 'customers_update',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do cliente a ser atualizado',
    format: 'uuid',
    example: 'd3b07384-d113-4956-a5cc-e435987114e9',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente atualizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos',
    type: ValidationErrorResponseDto,
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerOutput> {
    return this.updateCustomerUseCase.execute({
      ...dto,
      tenantId: user.tenantId,
      id,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover cliente',
    description:
      'Remove permanentemente um cliente do Tenant. Ação exclusiva para ADMIN. Clientes com histórico de vendas não podem ser removidos.',
    operationId: 'customers_remove',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do cliente a ser removido',
    format: 'uuid',
    example: 'd3b07384-d113-4956-a5cc-e435987114e9',
  })
  @ApiResponse({
    status: 204,
    description: 'Cliente removido com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode remover clientes',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
    type: NotFoundResponseDto,
  })
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.deleteCustomerUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
  }
}
