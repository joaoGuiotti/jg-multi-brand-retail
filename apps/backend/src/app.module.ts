import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { provideTransformInterceptor } from './infrastructure/interceptors/transform/transform-interceptor.provider';
import { AuthModule } from './infrastructure/modules/auth.module';
import { ConfigModule } from './infrastructure/modules/config.module';
import { CustomersModule } from './infrastructure/modules/customers.module';
import { DevModule } from './infrastructure/modules/dev.module';
import { InventoryModule } from './infrastructure/modules/inventory.module';
import { PaymentsModule } from './infrastructure/modules/payments.module';
import { PrismaModule } from './infrastructure/modules/prisma.module';
import { ProductsModule } from './infrastructure/modules/products.module';
import { SalesModule } from './infrastructure/modules/sales.module';

import { NotificationsModule } from './infrastructure/modules/notifications.module';
import { DashboardModule } from './infrastructure/modules/dashboard.module';
import { ReturnsModule } from './infrastructure/modules/returns.module';
import { LoyaltyModule } from './infrastructure/modules/loyalty.module';
import { FinanceModule } from './infrastructure/modules/finance.module';

import { HealthController } from './infrastructure/controllers/health.controller';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProductsModule,
    SalesModule,
    PaymentsModule,
    InventoryModule,
    CustomersModule,
    NotificationsModule,
    DashboardModule,
    ReturnsModule,
    LoyaltyModule,
    FinanceModule,
    ...(isDev ? [DevModule] : []),
  ],
  controllers: [HealthController],
  providers: [provideTransformInterceptor()],
})
export class AppModule {}
