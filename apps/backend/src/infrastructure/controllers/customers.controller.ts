import { CustomerOutput } from '@application/use-cases/customers/common/customer-output';
import { CreateCustomerUseCase } from '@application/use-cases/customers/create-customer.use-case';
import { DeleteCustomerUseCase } from '@application/use-cases/customers/delete-customer.use-case';
import { GetCustomerUseCase } from '@application/use-cases/customers/get-customer.use-case';
import { ListCustomersOutput, ListCustomersUseCase } from '@application/use-cases/customers/list-customers.use-case';
import { UpdateCustomerUseCase } from '@application/use-cases/customers/update-customer.use-case';
import { CreateCustomerDto } from '@infrastructure/dtos/customers/create-customer.dto';
import { QueryCustomerDto } from '@infrastructure/dtos/customers/query-customer.dto';
import { UpdateCustomerDto } from '@infrastructure/dtos/customers/update-customer.dto';
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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class CustomersController {
    constructor(
        private createCustomerUseCase: CreateCustomerUseCase,
        private listCustomersUseCase: ListCustomersUseCase,
        private getCustomerUseCase: GetCustomerUseCase,
        private updateCustomerUseCase: UpdateCustomerUseCase,
        private deleteCustomerUseCase: DeleteCustomerUseCase,
    ) { }

    @Post()
    async create(
        @CurrentUser() user: any,
        @Body() dto: CreateCustomerDto,
    ): Promise<CustomerOutput> {
        return this.createCustomerUseCase.execute({
            ...dto,
            tenantId: user.tenantId,
        });
    }

    @Get()
    async findAll(
        @CurrentUser() user: any,
        @Query() query: QueryCustomerDto,
    ): Promise<ListCustomersOutput> {
        return this.listCustomersUseCase.execute({
            tenantId: user.tenantId,
            filters: query,
        });
    }

    @Get(':id')
    async findOne(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ): Promise<CustomerOutput> {
        return this.getCustomerUseCase.execute({
            tenantId: user.tenantId,
            id,
        });
    }

    @Patch(':id')
    async update(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() dto: UpdateCustomerDto,
    ): Promise<CustomerOutput> {
        return this.updateCustomerUseCase.execute({
            ...dto,
            tenantId: user.tenantId,
            id,
        });
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ): Promise<void> {
        return this.deleteCustomerUseCase.execute({
            tenantId: user.tenantId,
            id,
        });
    }
}
