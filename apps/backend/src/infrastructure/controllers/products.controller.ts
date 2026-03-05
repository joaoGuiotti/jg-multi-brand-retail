import { AdjustStockUseCase } from '@application/use-cases/products/adjust-stock.use-case';
import { ProductOutput } from '@application/use-cases/products/common/product-output';
import { CreateProductUseCase } from '@application/use-cases/products/create-product.use-case';
import { DeleteProductUseCase } from '@application/use-cases/products/delete-product.use-case';
import { GetProductUseCase } from '@application/use-cases/products/get-product.use-case';
import { ListProductsOutput, ListProductsUseCase } from '@application/use-cases/products/list-products.use-case';
import { UpdateProductUseCase } from '@application/use-cases/products/update-product.use-case';
import { UpdateStockUseCase } from '@application/use-cases/products/update-stock.use-case';
import { CreateProductDto, QueryProductDto, UpdateProductDto } from '@infrastructure/dtos/products';
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
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ProductCollectionPresenter, ProductPresenter } from '../presenters/product.presenter';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {

    constructor(
        private createProductUseCase: CreateProductUseCase,
        private listProductsUseCase: ListProductsUseCase,
        private getProductUseCase: GetProductUseCase,
        private updateProductUseCase: UpdateProductUseCase,
        private deleteProductUseCase: DeleteProductUseCase,
        private updateStockUseCase: UpdateStockUseCase,
        private adjustStockUseCase: AdjustStockUseCase,
    ) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async create(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
        return this.createProductUseCase.execute({ ...createProductDto, tenantId: user.tenantId });
    }

    @Get()
    async findAll(@CurrentUser() user: any, @Query() query: QueryProductDto) {
        const output = await this.listProductsUseCase.execute({ tenantId: user.tenantId, filters: query });
        return ProductsController.serializeCollection(output);
    }

    @Get('sku/:sku')
    async findBySku(@CurrentUser() user: any, @Param('sku') sku: string) {
        const output = await this.getProductUseCase.executeBySku(user.tenantId, sku);
        return ProductsController.serialize(output);
    }

    @Get('barcode/:barcode')
    async findByBarcode(@CurrentUser() user: any, @Param('barcode') barcode: string) {
        const output = await this.getProductUseCase.executeByBarcode(user.tenantId, barcode);
        return ProductsController.serialize(output);
    }

    @Get(':id')
    async findOne(@CurrentUser() user: any, @Param('id') id: string) {
        const output = await this.getProductUseCase.execute({ tenantId: user.tenantId, id });
        return ProductsController.serialize(output);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
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
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.deleteProductUseCase.execute({ tenantId: user.tenantId, id });
    }

    @Patch(':id/stock')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    updateStock(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body('quantity') quantity: number,
    ) {
        return this.updateStockUseCase.execute({ tenantId: user.tenantId, id, quantity });
    }

    @Patch(':id/stock/adjust')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    adjustStock(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body('adjustment') adjustment: number,
    ) {
        return this.adjustStockUseCase.execute({ tenantId: user.tenantId, id, adjustment });
    }

    static serialize(output: ProductOutput) {
        return new ProductPresenter(output);
    }

    static serializeCollection(output: ListProductsOutput) {
        return new ProductCollectionPresenter(output);
    }
}
