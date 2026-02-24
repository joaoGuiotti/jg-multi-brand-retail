import { CancelPaymentUseCase } from '@application/use-cases/payments/cancel-payment.use-case';
import { CreatePaymentUseCase } from '@application/use-cases/payments/create-payment.use-case';
import { GetPaymentUseCase } from '@application/use-cases/payments/get-payment.use-case';
import { GetSalePaymentsUseCase } from '@application/use-cases/payments/get-sale-payments.use-case';
import { ListPaymentsUseCase } from '@application/use-cases/payments/list-payments.use-case';
import { CreatePaymentDto, QueryPaymentDto } from '@infrastructure/dtos/payments';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PaymentCollectionPresenter, PaymentPresenter } from '../presenters/payment.presenter';

enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    @Inject(CreatePaymentUseCase)
    private readonly createPaymentUseCase: CreatePaymentUseCase;
    @Inject(CancelPaymentUseCase)
    private readonly cancelPaymentUseCase: CancelPaymentUseCase;
    @Inject(ListPaymentsUseCase)
    private readonly listPaymentsUseCase: ListPaymentsUseCase;
    @Inject(GetPaymentUseCase)
    private readonly getPaymentUseCase: GetPaymentUseCase;
    @Inject(GetSalePaymentsUseCase)
    private readonly getSalePaymentsUseCase: GetSalePaymentsUseCase;

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.USER)
    async create(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
        const output = await this.createPaymentUseCase.execute({
            tenantId: user.tenantId,
            ...dto,
        });
        return new PaymentPresenter(output);
    }

    @Get()
    async findAll(@CurrentUser() user: any, @Query() query: QueryPaymentDto) {
        const output = await this.listPaymentsUseCase.execute({ tenantId: user.tenantId, filters: query });
        return new PaymentCollectionPresenter(output);
    }

    @Get('sale/:saleId')
    async findBySale(@CurrentUser() user: any, @Param('saleId') saleId: string) {
        const output = await this.getSalePaymentsUseCase.execute({ saleId });
        return output.map((p) => new PaymentPresenter(p));
    }

    @Get(':id')
    async findOne(@CurrentUser() user: any, @Param('id') id: string) {
        const output = await this.getPaymentUseCase.execute({ tenantId: user.tenantId, id });
        return new PaymentPresenter(output);
    }

    @Patch(':id/cancel')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async cancel(@CurrentUser() user: any, @Param('id') id: string) {
        const output = await this.cancelPaymentUseCase.execute({ tenantId: user.tenantId, id });
        return new PaymentPresenter(output);
    }
}
