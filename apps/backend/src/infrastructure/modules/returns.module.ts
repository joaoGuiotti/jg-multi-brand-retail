import { Module } from '@nestjs/common';
import { ReturnsRepository } from '../../domain/repositories/returns/returns.repository.interface';
import { PrismaReturnsRepository } from '../persistence/returns/prisma-returns.repository';
import { PrismaModule } from './prisma.module';
import { CreateReturnUseCase } from '../../application/use-cases/returns/create-return.use-case';
import { ListReturnsUseCase } from '../../application/use-cases/returns/list-returns.use-case';
import { GetReturnUseCase } from '../../application/use-cases/returns/get-return.use-case';
import { UpdateReturnStatusUseCase } from '../../application/use-cases/returns/update-return-status.use-case';
import { ProcessRefundUseCase } from '../../application/use-cases/returns/process-refund.use-case';
import { ReturnsController } from '../controllers/returns.controller';
import { SaleRepository } from '../../domain/repositories/sale-repository';
import { PrismaSaleRepository } from '../persistence/repositories/prisma-sale.repository';
import { UserRepository } from '../../domain/repositories/user-repository';
import { PrismaUserRepository } from '../persistence/repositories/prisma-user.repository';
import { NotificationsModule } from './notifications.module';
import { LoyaltyModule } from './loyalty.module';

@Module({
  imports: [PrismaModule, NotificationsModule, LoyaltyModule],
  controllers: [ReturnsController],
  providers: [
    {
      provide: ReturnsRepository,
      useClass: PrismaReturnsRepository,
    },
    {
      provide: SaleRepository,
      useClass: PrismaSaleRepository,
    },
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    CreateReturnUseCase,
    ListReturnsUseCase,
    GetReturnUseCase,
    UpdateReturnStatusUseCase,
    ProcessRefundUseCase,
  ],
  exports: [
    ReturnsRepository,
    CreateReturnUseCase,
    ListReturnsUseCase,
    GetReturnUseCase,
    UpdateReturnStatusUseCase,
    ProcessRefundUseCase,
  ],
})
export class ReturnsModule {}
