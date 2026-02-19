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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProductDto, QueryProductDto, UpdateProductDto } from './dto';
import { ProductsService } from './products.service';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    create(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
        return this.productsService.create(user.tenantId, createProductDto);
    }

    @Get()
    findAll(@CurrentUser() user: any, @Query() query: QueryProductDto) {
        return this.productsService.findAll(user.tenantId, query);
    }

    @Get('sku/:sku')
    findBySku(@CurrentUser() user: any, @Param('sku') sku: string) {
        return this.productsService.findBySku(user.tenantId, sku);
    }

    @Get('barcode/:barcode')
    findByBarcode(@CurrentUser() user: any, @Param('barcode') barcode: string) {
        return this.productsService.findByBarcode(user.tenantId, barcode);
    }

    @Get(':id')
    findOne(@CurrentUser() user: any, @Param('id') id: string) {
        return this.productsService.findOne(user.tenantId, id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    update(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
    ) {
        return this.productsService.update(user.tenantId, id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.productsService.remove(user.tenantId, id);
    }

    @Patch(':id/stock')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    updateStock(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body('quantity') quantity: number,
    ) {
        return this.productsService.updateStock(user.tenantId, id, quantity);
    }

    @Patch(':id/stock/adjust')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    adjustStock(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body('adjustment') adjustment: number,
    ) {
        return this.productsService.adjustStock(user.tenantId, id, adjustment);
    }
}
