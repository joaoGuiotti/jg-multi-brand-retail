import { CreateMovementUseCase } from '@application/use-cases/inventory/create-movement.use-case';
import { GetProductMovementsUseCase } from '@application/use-cases/inventory/get-product-movements.use-case';
import { GetStockSummaryUseCase } from '@application/use-cases/inventory/get-stock-summary.use-case';
import { ListMovementsUseCase } from '@application/use-cases/inventory/list-movements.use-case';
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
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
}
