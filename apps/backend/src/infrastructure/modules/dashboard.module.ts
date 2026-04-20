import { Module } from '@nestjs/common';
import { GetDashboardSnapshotUseCase } from '../../application/use-cases/dashboard/get-dashboard-snapshot.use-case';
import { DashboardController } from '../controllers/dashboard.controller';
import { PrismaModule } from './prisma.module';
import { NotificationsModule } from './notifications.module';
import { DashboardEventsHandler } from '../../application/events/handlers/dashboard-events.handler';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DashboardController],
  providers: [GetDashboardSnapshotUseCase, DashboardEventsHandler],
  exports: [GetDashboardSnapshotUseCase],
})
export class DashboardModule {}
