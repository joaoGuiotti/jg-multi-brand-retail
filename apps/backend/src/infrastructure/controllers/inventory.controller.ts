import { CreateMovementUseCase } from '@application/use-cases/inventory/create-movement.use-case';
import { GetProductMovementsUseCase } from '@application/use-cases/inventory/get-product-movements.use-case';
import { GetStockSummaryUseCase } from '@application/use-cases/inventory/get-stock-summary.use-case';
import { ListMovementsUseCase } from '@application/use-cases/inventory/list-movements.use-case';
import { GenerateInventoryReportUseCase } from '@application/use-cases/inventory/generate-inventory-report.use-case';
import { CreateInventoryMovementDto, QueryInventoryMovementDto } from '@infrastructure/dtos/inventory';
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
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { MovementCollectionPresenter, MovementPresenter } from '../presenters/movement.presenter';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
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
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
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
    async findAllMovements(@CurrentUser() user: any, @Query() query: QueryInventoryMovementDto) {
        const output = await this.listMovementsUseCase.execute({ tenantId: user.tenantId, filters: query });
        return new MovementCollectionPresenter(output);
    }

    @Get('movements/:id')
    async findOneMovement(@CurrentUser() user: any, @Param('id') id: string) {
        const output = await this.listMovementsUseCase.execute({
            tenantId: user.tenantId,
            filters: { sortBy: 'createdAt', sortOrder: 'desc' },
        });
        return new MovementCollectionPresenter(output);
    }

    @Get('product/:productId')
    async findByProduct(@CurrentUser() user: any, @Param('productId') productId: string) {
        return this.getProductMovementsUseCase.execute({ tenantId: user.tenantId, productId });
    }

    @Get('summary')
    @HttpCode(HttpStatus.OK)
    async getStockSummary(@CurrentUser() user: any) {
        return this.getStockSummaryUseCase.execute({ tenantId: user.tenantId });
    }

    @Get('report')
    @ApiOperation({ summary: 'Download inventory report as PDF' })
    @ApiProduces('application/pdf')
    @ApiResponse({ status: 200, description: 'PDF inventory report', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
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
