import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { LoyaltyRepository } from '../../domain/repositories/loyalty/loyalty.repository.interface';
import { PrismaLoyaltyRepository } from '../persistence/loyalty/prisma-loyalty.repository';
import { ConfigureLoyaltyProgramUseCase } from '../../application/use-cases/loyalty/configure-loyalty-program.use-case';
import { EarnPointsUseCase } from '../../application/use-cases/loyalty/earn-points.use-case';
import { RedeemPointsUseCase } from '../../application/use-cases/loyalty/redeem-points.use-case';
import { GetLoyaltyAccountUseCase } from '../../application/use-cases/loyalty/get-loyalty-account.use-case';
import { AdjustPointsManualUseCase } from '../../application/use-cases/loyalty/adjust-points-manual.use-case';
import { LoyaltyEventsHandler } from '../../application/events/handlers/loyalty-events.handler';
import { LoyaltyController } from '../controllers/loyalty.controller';
import { AuditLogsService } from '../services/audit-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [LoyaltyController],
  providers: [
    {
      provide: LoyaltyRepository,
      useClass: PrismaLoyaltyRepository,
    },
    ConfigureLoyaltyProgramUseCase,
    EarnPointsUseCase,
    RedeemPointsUseCase,
    GetLoyaltyAccountUseCase,
    AdjustPointsManualUseCase,
    LoyaltyEventsHandler,
    AuditLogsService,
  ],
  exports: [
    LoyaltyRepository,
    ConfigureLoyaltyProgramUseCase,
    EarnPointsUseCase,
    RedeemPointsUseCase,
    GetLoyaltyAccountUseCase,
    AdjustPointsManualUseCase,
    AuditLogsService,
  ],
})
export class LoyaltyModule {}
