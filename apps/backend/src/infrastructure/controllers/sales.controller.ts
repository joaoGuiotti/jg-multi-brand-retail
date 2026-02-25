import { CancelSaleUseCase } from '@application/use-cases/sales/cancel-sale.use-case';
import { CompleteSaleUseCase } from '@application/use-cases/sales/complete-sale.use-case';
import { CreateSaleUseCase } from '@application/use-cases/sales/create-sale.use-case';
import { GetDailyRevenueUseCase } from '@application/use-cases/sales/get-daily-revenue.use-case';
import { GetSaleUseCase } from '@application/use-cases/sales/get-sale.use-case';
import { ListSalesUseCase } from '@application/use-cases/sales/list-sales.use-case';
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
    UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { SaleCollectionPresenter, SalePresenter } from '../presenters/sale.presenter';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {

    constructor(
        private createSaleUseCase: CreateSaleUseCase,
        private listSalesUseCase: ListSalesUseCase,
        private getSaleUseCase: GetSaleUseCase,
        private cancelSaleUseCase: CancelSaleUseCase,
        private completeSaleUseCase: CompleteSaleUseCase,
        private getDailyRevenueUseCase: GetDailyRevenueUseCase,
    ) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    async create(@CurrentUser() user: any, @Body() createSaleDto: CreateSaleDto) {
        const output = await this.createSaleUseCase.execute({
            tenantId: user.tenantId,
            userId: user.id,
            ...createSaleDto,
        });
        return new SalePresenter(output);
    }

    @Get()
    async findAll(@CurrentUser() user: any, @Query() query: QuerySaleDto) {
        const output = await this.listSalesUseCase.execute({ tenantId: user.tenantId, filters: query });
        return new SaleCollectionPresenter(output);
    }

    @Get('reports/daily-revenue')
    async getDailyRevenue(@CurrentUser() user: any, @Query('days') days?: number) {
        const output = await this.getDailyRevenueUseCase.execute({
            tenantId: user.tenantId,
            days: days ? Number(days) : 7,
        });
        return output;
    }

    @Get(':id')
    async findOne(@CurrentUser() user: any, @Param('id') id: string) {
        const output = await this.getSaleUseCase.execute({ tenantId: user.tenantId, id });
        return new SalePresenter(output);
    }

    @Patch(':id/cancel')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async cancel(@CurrentUser() user: any, @Param('id') id: string) {
        const output = await this.cancelSaleUseCase.execute({ tenantId: user.tenantId, id });
        return new SalePresenter(output);
    }

    @Patch(':id/complete')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    @HttpCode(HttpStatus.OK)
    async complete(@CurrentUser() user: any, @Param('id') id: string) {
        const output = await this.completeSaleUseCase.execute({ tenantId: user.tenantId, id });
        return new SalePresenter(output);
    }
}

