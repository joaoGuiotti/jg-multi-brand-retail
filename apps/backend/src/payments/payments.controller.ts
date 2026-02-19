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
import { CreatePaymentDto, QueryPaymentDto } from './dto';
import { PaymentsService } from './payments.service';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    create(@CurrentUser() user: any, @Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.create(user.tenantId, createPaymentDto);
    }

    @Get()
    findAll(@CurrentUser() user: any, @Query() query: QueryPaymentDto) {
        return this.paymentsService.findAll(user.tenantId, query);
    }

    @Get('sale/:saleId')
    findBySale(@CurrentUser() user: any, @Param('saleId') saleId: string) {
        return this.paymentsService.findBySale(user.tenantId, saleId);
    }

    @Get(':id')
    findOne(@CurrentUser() user: any, @Param('id') id: string) {
        return this.paymentsService.findOne(user.tenantId, id);
    }

    @Patch(':id/cancel')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    cancel(@CurrentUser() user: any, @Param('id') id: string) {
        return this.paymentsService.cancel(user.tenantId, id);
    }
}
