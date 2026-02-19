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
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSaleDto, QuerySaleDto } from './dto';
import { SalesService } from './sales.service';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    create(@CurrentUser() user: any, @Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(user.tenantId, user.id, createSaleDto);
    }

    @Get()
    findAll(@CurrentUser() user: any, @Query() query: QuerySaleDto) {
        return this.salesService.findAll(user.tenantId, query);
    }

    @Get(':id')
    findOne(@CurrentUser() user: any, @Param('id') id: string) {
        return this.salesService.findOne(user.tenantId, id);
    }

    @Patch(':id/cancel')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    cancel(@CurrentUser() user: any, @Param('id') id: string) {
        return this.salesService.cancel(user.tenantId, id);
    }

    @Patch(':id/complete')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    @HttpCode(HttpStatus.OK)
    complete(@CurrentUser() user: any, @Param('id') id: string) {
        return this.salesService.complete(user.tenantId, id);
    }
}
