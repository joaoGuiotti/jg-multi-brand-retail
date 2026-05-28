import { AdjustStockUseCase } from '@application/use-cases/products/adjust-stock.use-case';
import { ProductOutput } from '@application/use-cases/products/common/product-output';
import { CreateProductUseCase } from '@application/use-cases/products/create-product.use-case';
import { DeleteProductUseCase } from '@application/use-cases/products/delete-product.use-case';
import { GetProductUseCase } from '@application/use-cases/products/get-product.use-case';
import {
  ListProductsOutput,
  ListProductsUseCase,
} from '@application/use-cases/products/list-products.use-case';
import { UpdateProductUseCase } from '@application/use-cases/products/update-product.use-case';
import { UpdateStockUseCase } from '@application/use-cases/products/update-stock.use-case';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from '@infrastructure/dtos/products';
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
  ApiBody,
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
  ProductCollectionPresenter,
  ProductPresenter,
} from '../presenters/product.presenter';
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('products')
@ApiBearerAuth('JWT')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class ProductsController {
  constructor(
    private createProductUseCase: CreateProductUseCase,
    private listProductsUseCase: ListProductsUseCase,
    private getProductUseCase: GetProductUseCase,
    private updateProductUseCase: UpdateProductUseCase,
    private deleteProductUseCase: DeleteProductUseCase,
    private updateStockUseCase: UpdateStockUseCase,
    private adjustStockUseCase: AdjustStockUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Criar produto',
    description:
      'Cadastra um novo produto no catálogo do Tenant. O SKU deve ser único dentro do Tenant. Exclusivo para ADMIN.',
    operationId: 'products_create',
  })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode criar produtos',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos ou SKU já cadastrado',
    type: ValidationErrorResponseDto,
  })
  async create(
    @CurrentUser() user: any,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.createProductUseCase.execute({
      ...createProductDto,
      tenantId: user.tenantId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar produtos',
    description:
      'Retorna lista paginada de produtos do Tenant com suporte a filtros por nome, SKU, categoria e status de estoque.',
    operationId: 'products_findAll',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async findAll(@CurrentUser() user: any, @Query() query: QueryProductDto) {
    const output = await this.listProductsUseCase.execute({
      tenantId: user.tenantId,
      filters: query,
    });
    return ProductsController.serializeCollection(output);
  }

  @Get('sku/:sku')
  @ApiOperation({
    summary: 'Buscar produto por SKU',
    description: 'Localiza um produto pelo seu código SKU único dentro do Tenant.',
    operationId: 'products_findBySku',
  })
  @ApiParam({
    name: 'sku',
    description: 'Código SKU do produto',
    example: 'PROD-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produto com o SKU informado não encontrado',
    type: NotFoundResponseDto,
  })
  async findBySku(@CurrentUser() user: any, @Param('sku') sku: string) {
    const output = await this.getProductUseCase.executeBySku(
      user.tenantId,
      sku,
    );
    return ProductsController.serialize(output);
  }

  @Get('barcode/:barcode')
  @ApiOperation({
    summary: 'Buscar produto por código de barras',
    description:
      'Localiza um produto pelo código de barras (EAN-13, EAN-8, etc.). Ideal para leitura via scanner no PDV.',
    operationId: 'products_findByBarcode',
  })
  @ApiParam({
    name: 'barcode',
    description: 'Código de barras do produto (EAN-13, UPC, etc.)',
    example: '7891000315507',
  })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produto com o código de barras informado não encontrado',
    type: NotFoundResponseDto,
  })
  async findByBarcode(
    @CurrentUser() user: any,
    @Param('barcode') barcode: string,
  ) {
    const output = await this.getProductUseCase.executeByBarcode(
      user.tenantId,
      barcode,
    );
    return ProductsController.serialize(output);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar produto por ID',
    description: 'Retorna os dados completos de um produto específico pelo UUID.',
    operationId: 'products_findOne',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado com sucesso',
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
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.getProductUseCase.execute({
      tenantId: user.tenantId,
      id,
    });
    return ProductsController.serialize(output);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualizar produto',
    description:
      'Atualiza parcialmente os dados de um produto. Apenas os campos enviados no body serão alterados. Exclusivo para ADMIN.',
    operationId: 'products_update',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto a ser atualizado',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode atualizar produtos',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos',
    type: ValidationErrorResponseDto,
  })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateProduct: UpdateProductDto,
  ) {
    return this.updateProductUseCase.execute({
      ...updateProduct,
      tenantId: user.tenantId,
      id,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover produto',
    description:
      'Remove permanentemente um produto do catálogo. Produtos com histórico de vendas não podem ser removidos. Exclusivo para ADMIN.',
    operationId: 'products_remove',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto a ser removido',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'Produto removido com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode remover produtos',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado',
    type: NotFoundResponseDto,
  })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deleteProductUseCase.execute({ tenantId: user.tenantId, id });
  }

  @Patch(':id/stock')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Definir quantidade em estoque',
    description:
      'Define (sobrescreve) a quantidade total de um produto no estoque. Para ajustes relativos (entrada/saída), use `PATCH /products/:id/stock/adjust`.',
    operationId: 'products_updateStock',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['quantity'],
      properties: {
        quantity: {
          type: 'number',
          minimum: 0,
          description: 'Nova quantidade absoluta em estoque',
          example: 50,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estoque atualizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode alterar estoque',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado',
    type: NotFoundResponseDto,
  })
  updateStock(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.updateStockUseCase.execute({
      tenantId: user.tenantId,
      id,
      quantity,
    });
  }

  @Patch(':id/stock/adjust')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Ajustar estoque (entrada/saída relativa)',
    description:
      'Aplica um ajuste relativo ao estoque: valores positivos para entrada, negativos para saída. Para sobrescrever a quantidade total, use `PATCH /products/:id/stock`.',
    operationId: 'products_adjustStock',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['adjustment'],
      properties: {
        adjustment: {
          type: 'number',
          description: 'Ajuste relativo (positivo = entrada, negativo = saída)',
          example: -5,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estoque ajustado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode ajustar estoque',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado',
    type: NotFoundResponseDto,
  })
  adjustStock(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('adjustment') adjustment: number,
  ) {
    return this.adjustStockUseCase.execute({
      tenantId: user.tenantId,
      id,
      adjustment,
    });
  }

  static serialize(output: ProductOutput) {
    return new ProductPresenter(output);
  }

  static serializeCollection(output: ListProductsOutput) {
    return new ProductCollectionPresenter(output);
  }
}
