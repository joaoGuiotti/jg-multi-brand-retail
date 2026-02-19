import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInventoryMovementDto, QueryInventoryMovementDto } from './dto';
import { InventoryService } from './inventory.service';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post('movements')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    createMovement(
        @CurrentUser() user: any,
        @Body() createMovementDto: CreateInventoryMovementDto,
    ) {
        return this.inventoryService.createMovement(user.tenantId, user.id, createMovementDto);
    }

    @Get('movements')
    findAllMovements(@CurrentUser() user: any, @Query() query: QueryInventoryMovementDto) {
        return this.inventoryService.findAll(user.tenantId, query);
    }

    @Get('movements/:id')
    findOneMovement(@CurrentUser() user: any, @Param('id') id: string) {
        return this.inventoryService.findOne(user.tenantId, id);
    }

    @Get('product/:productId')
    findByProduct(@CurrentUser() user: any, @Param('productId') productId: string) {
        return this.inventoryService.findByProduct(user.tenantId, productId);
    }

    @Get('summary')
    @HttpCode(HttpStatus.OK)
    getStockSummary(@CurrentUser() user: any) {
        return this.inventoryService.getStockSummary(user.tenantId);
    }
}
