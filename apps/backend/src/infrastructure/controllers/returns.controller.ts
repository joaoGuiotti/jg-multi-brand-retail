import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateReturnUseCase } from '../../application/use-cases/returns/create-return.use-case';
import { ListReturnsUseCase } from '../../application/use-cases/returns/list-returns.use-case';
import { GetReturnUseCase } from '../../application/use-cases/returns/get-return.use-case';
import { UpdateReturnStatusUseCase } from '../../application/use-cases/returns/update-return-status.use-case';
import { ProcessRefundUseCase } from '../../application/use-cases/returns/process-refund.use-case';
import { CreateReturnDto } from '../dtos/returns/create-return.dto';
import { ApproveReturnDto } from '../dtos/returns/approve-return.dto';
import { ReturnPresenter, ReturnCollectionPresenter } from '../presenters/return.presenter';

import { Role } from '@prisma/client';

@ApiTags('returns')
@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(
    private readonly createReturnUseCase: CreateReturnUseCase,
    private readonly listReturnsUseCase: ListReturnsUseCase,
    private readonly getReturnUseCase: GetReturnUseCase,
    private readonly updateReturnStatusUseCase: UpdateReturnStatusUseCase,
    private readonly processRefundUseCase: ProcessRefundUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.USER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createReturnDto: CreateReturnDto,
  ) {
    const output = await this.createReturnUseCase.execute(
      user.tenantId,
      user.id,
      createReturnDto,
    );
    return new ReturnPresenter(output);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    const output = await this.listReturnsUseCase.execute(user.tenantId, {
      status: query.status,
      saleId: query.saleId,
      customerId: query.customerId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    });

    return new ReturnCollectionPresenter(output);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.getReturnUseCase.execute(user.tenantId, id);
    return new ReturnPresenter(output);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() approveReturnDto: ApproveReturnDto,
  ) {
    const output = await this.updateReturnStatusUseCase.execute(
      user.tenantId,
      user.id,
      id,
      approveReturnDto,
    );
    return new ReturnPresenter(output);
  }

  @Patch(':id/refund')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async processRefund(@CurrentUser() user: any, @Param('id') id: string) {
    const output = await this.processRefundUseCase.execute(user.tenantId, id);
    return new ReturnPresenter(output);
  }
}
